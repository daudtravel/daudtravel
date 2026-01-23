import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { getBOGAccessToken } from '@/common/utils/bog-auth';
import { BOG_API_URL, verifyBOGSignature } from '@/common/utils/bog-payments';
import { PaymentStatus } from '@prisma/client';
import { FileUploadService } from '@/common/utils/file-upload.util';
import { Response } from 'express';
import * as crypto from 'crypto';

import {
  CreateInsuranceSubmissionDto,
  UpdateInsuranceSettingsDto,
} from './dto/insurance.dto';
import { MailService } from '@/mail/mail.service';
import { getPrimaryFrontendUrl } from '@/common/utils/frontend-url.util';

@Injectable()
export class InsuranceService {
  constructor(
    private prisma: PrismaService,
    private fileUpload: FileUploadService,
    private mailService: MailService,
  ) {}

  private generateSecureViewToken(
    submissionId: string,
    personId: string,
  ): string {
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const payload = `${submissionId}:${personId}:${expiresAt}`;

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const signature = hmac.digest('hex');

    return `${Buffer.from(payload).toString('base64')}.${signature}`;
  }

  async viewSecurePassportPhoto(
    submissionId: string,
    personId: string,
    token: string,
    res: Response,
  ) {
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    try {
      const [encodedPayload, signature] = token.split('.');
      if (!encodedPayload || !signature) {
        throw new BadRequestException('Invalid token format');
      }

      const payload = Buffer.from(encodedPayload, 'base64').toString('utf-8');
      const [tokenSubmissionId, tokenPersonId, expiresAt] = payload.split(':');

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      if (signature !== expectedSignature) {
        throw new BadRequestException('Invalid token signature');
      }

      if (Date.now() > parseInt(expiresAt)) {
        throw new BadRequestException('Token expired');
      }

      if (tokenSubmissionId !== submissionId || tokenPersonId !== personId) {
        throw new BadRequestException('Token mismatch');
      }

      const person = await this.prisma.insurancePerson.findUnique({
        where: { id: personId },
        include: { submission: true },
      });

      if (!person || person.submissionId !== submissionId) {
        throw new NotFoundException('Photo not found');
      }

      const filePath = person.passportPhoto.replace('/uploads/', '');
      return res.sendFile(filePath, { root: './uploads' });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Invalid or expired link');
    }
  }

  async getSettings() {
    let settings = await this.prisma.insuranceSettings.findFirst();

    if (!settings) {
      settings = await this.prisma.insuranceSettings.create({
        data: {
          pricePerPerson: 1.0,
          adminEmail: process.env.ADMIN_EMAIL || 'admin@daudtravel.com',
          isActive: true,
        },
      });
    }

    return {
      success: true,
      data: {
        id: settings.id,
        pricePerPerson: Number(settings.pricePerPerson),
        adminEmail: settings.adminEmail,
        isActive: settings.isActive,
      },
    };
  }

  async updateSettings(dto: UpdateInsuranceSettingsDto) {
    const settings = await this.prisma.insuranceSettings.findFirst();

    if (!settings) {
      throw new NotFoundException('Settings not found');
    }

    const updated = await this.prisma.insuranceSettings.update({
      where: { id: settings.id },
      data: {
        pricePerPerson: dto.pricePerPerson,
        adminEmail: dto.adminEmail,
        isActive: dto.isActive,
      },
    });

    return {
      success: true,
      data: {
        id: updated.id,
        pricePerPerson: Number(updated.pricePerPerson),
        adminEmail: updated.adminEmail,
        isActive: updated.isActive,
      },
    };
  }

  async createSubmission(dto: CreateInsuranceSubmissionDto) {
    const settings = await this.prisma.insuranceSettings.findFirst();
    if (!settings) {
      throw new InternalServerErrorException(
        'Insurance service not configured',
      );
    }

    if (!settings.isActive) {
      throw new BadRequestException(
        'Insurance service is currently unavailable',
      );
    }

    if (dto.people.length === 0) {
      throw new BadRequestException('At least one person is required');
    }

    const peopleCount = dto.people.length;
    const pricePerPerson = Number(settings.pricePerPerson);
    const totalAmount = peopleCount * pricePerPerson;

    const uploadedPeople = await Promise.all(
      dto.people.map(async (person) => {
        const uploaded = await this.fileUpload.uploadBase64Image(
          person.passportPhoto,
          'insurance-passports',
        );

        return {
          fullName: person.fullName,
          phoneNumber: person.phoneNumber,
          passportPhoto: uploaded.url,
        };
      }),
    );

    const external_order_id = `INS_${uuidv4()}`;
    const accessToken = await getBOGAccessToken();

    const frontendUrl = getPrimaryFrontendUrl();
    if (!frontendUrl) {
      throw new InternalServerErrorException(
        'FRONTEND_URL environment variable is not configured',
      );
    }

    const bogOrderRequest = {
      callback_url: `${process.env.BASE_URL}/api/insurance/bog/callback`,
      external_order_id,
      purchase_units: {
        currency: 'GEL',
        total_amount: totalAmount,
        basket: [
          {
            product_id: 'insurance',
            description: `Travel Insurance for ${peopleCount} person(s)`,
            quantity: peopleCount,
            unit_price: pricePerPerson,
            total_price: totalAmount,
          },
        ],
      },
      redirect_urls: {
        success: `${frontendUrl}/payment/success?order_id=${external_order_id}`,
        fail: `${frontendUrl}/payment/failure?order_id=${external_order_id}`,
      },
      ttl: 30,
    };

    const bogResponse = await fetch(`${BOG_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Accept-Language': 'en',
        'Idempotency-Key': uuidv4(),
      },
      body: JSON.stringify(bogOrderRequest),
    });

    if (!bogResponse.ok) {
      const errorText = await bogResponse.text();
      console.error('❌ BOG API Error:', errorText);

      await Promise.all(
        uploadedPeople.map((p) => this.fileUpload.deleteFile(p.passportPhoto)),
      );

      throw new InternalServerErrorException('Failed to create payment');
    }

    const bogOrderData = await bogResponse.json();

    const submission = await this.prisma.insuranceSubmission.create({
      data: {
        submitterEmail: dto.submitterEmail,
        externalOrderId: external_order_id,
        bogOrderId: bogOrderData.id,
        paymentUrl: bogOrderData._links.redirect.href,
        totalAmount,
        peopleCount,
        pricePerPerson,
        status: PaymentStatus.PENDING,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        people: {
          create: uploadedPeople,
        },
      },
      include: {
        people: true,
      },
    });

    return {
      success: true,
      data: {
        submissionId: submission.id,
        externalOrderId: submission.externalOrderId,
        paymentUrl: submission.paymentUrl,
        totalAmount: Number(submission.totalAmount),
        peopleCount: submission.peopleCount,
        pricePerPerson: Number(submission.pricePerPerson),
      },
    };
  }

  async handleBOGCallback(rawBody: string, signature: string) {
    if (!signature || !verifyBOGSignature(rawBody, signature)) {
      throw new BadRequestException('Invalid signature');
    }

    const callbackData = JSON.parse(rawBody);
    if (callbackData.event !== 'order_payment') {
      throw new BadRequestException('Invalid event type');
    }

    const orderData = callbackData.body;
    const statusKey = (orderData.order_status?.key || '').toLowerCase();

    let finalStatus: PaymentStatus = PaymentStatus.PENDING;

    if (statusKey === 'completed' || statusKey === 'partial_completed') {
      finalStatus = PaymentStatus.PAID;
    } else if (statusKey === 'rejected' || statusKey === 'failed') {
      finalStatus = PaymentStatus.FAILED;
    }

    const updateData: any = {
      status: finalStatus,
      transactionId: orderData.transaction_id,
      paymentMethod: orderData.payment_method,
      callbackData: orderData,
      paidAt: finalStatus === PaymentStatus.PAID ? new Date() : undefined,
      failedAt: finalStatus === PaymentStatus.FAILED ? new Date() : undefined,
    };

    const submission = await this.prisma.insuranceSubmission.findFirst({
      where: {
        OR: [
          { bogOrderId: orderData.order_id },
          { externalOrderId: orderData.external_order_id },
        ],
      },
      include: {
        people: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    await this.prisma.insuranceSubmission.update({
      where: { id: submission.id },
      data: updateData,
    });

    if (finalStatus === PaymentStatus.PAID && !submission.emailSent) {
      await this.sendAdminNotification(submission.id);
      await this.sendCustomerConfirmation(submission.id);
    }

    return {
      success: true,
      status: finalStatus,
    };
  }

  async getSubmissionStatus(externalOrderId: string) {
    const submission = await this.prisma.insuranceSubmission.findUnique({
      where: { externalOrderId },
      include: {
        people: {
          select: {
            fullName: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return {
      success: true,
      data: {
        id: submission.id,
        externalOrderId: submission.externalOrderId,
        status: submission.status,
        submitterEmail: submission.submitterEmail,
        peopleCount: submission.peopleCount,
        totalAmount: Number(submission.totalAmount),
        pricePerPerson: Number(submission.pricePerPerson),
        people: submission.people,
        paidAt: submission.paidAt?.toISOString(),
        createdAt: submission.createdAt.toISOString(),
      },
    };
  }

  async getAllSubmissions(
    status?: PaymentStatus,
    page: number = 1,
    limit: number = 50,
  ) {
    const skip = (page - 1) * limit;
    const whereClause: any = {};
    if (status) whereClause.status = status;

    const [submissions, total] = await Promise.all([
      this.prisma.insuranceSubmission.findMany({
        where: whereClause,
        include: {
          people: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.insuranceSubmission.count({ where: whereClause }),
    ]);

    return {
      success: true,
      data: submissions.map((sub) => ({
        id: sub.id,
        externalOrderId: sub.externalOrderId,
        submitterEmail: sub.submitterEmail,
        peopleCount: sub.peopleCount,
        totalAmount: Number(sub.totalAmount),
        pricePerPerson: Number(sub.pricePerPerson),
        status: sub.status,
        transactionId: sub.transactionId,
        paymentMethod: sub.paymentMethod,
        emailSent: sub.emailSent,
        emailSentAt: sub.emailSentAt?.toISOString(),
        paidAt: sub.paidAt?.toISOString(),
        failedAt: sub.failedAt?.toISOString(),
        createdAt: sub.createdAt.toISOString(),
        people: sub.people.map((p) => ({
          id: p.id,
          fullName: p.fullName,
          phoneNumber: p.phoneNumber,
          passportPhoto: p.passportPhoto,
        })),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSubmissionById(submissionId: string) {
    const submission = await this.prisma.insuranceSubmission.findUnique({
      where: { id: submissionId },
      include: {
        people: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return {
      success: true,
      data: {
        id: submission.id,
        externalOrderId: submission.externalOrderId,
        bogOrderId: submission.bogOrderId,
        submitterEmail: submission.submitterEmail,
        peopleCount: submission.peopleCount,
        totalAmount: Number(submission.totalAmount),
        pricePerPerson: Number(submission.pricePerPerson),
        status: submission.status,
        transactionId: submission.transactionId,
        paymentMethod: submission.paymentMethod,
        paymentUrl: submission.paymentUrl,
        callbackData: submission.callbackData,
        emailSent: submission.emailSent,
        emailSentAt: submission.emailSentAt?.toISOString(),
        expiresAt: submission.expiresAt.toISOString(),
        paidAt: submission.paidAt?.toISOString(),
        failedAt: submission.failedAt?.toISOString(),
        createdAt: submission.createdAt.toISOString(),
        updatedAt: submission.updatedAt.toISOString(),
        people: submission.people.map((p) => ({
          id: p.id,
          fullName: p.fullName,
          phoneNumber: p.phoneNumber,
          passportPhoto: p.passportPhoto,
          createdAt: p.createdAt.toISOString(),
        })),
      },
    };
  }

  async deleteSubmission(submissionId: string) {
    const submission = await this.prisma.insuranceSubmission.findUnique({
      where: { id: submissionId },
      include: { people: true },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    await Promise.all(
      submission.people.map(async (person) => {
        try {
          await this.fileUpload.deleteFile(person.passportPhoto);
        } catch (error) {
          console.error(
            `⚠️ Failed to delete passport photo: ${person.passportPhoto}`,
            error,
          );
        }
      }),
    );

    await this.prisma.insuranceSubmission.delete({
      where: { id: submissionId },
    });

    return {
      success: true,
      message: 'Insurance submission deleted successfully',
      deletedFiles: submission.people.length,
    };
  }

  async cleanupOldPaidSubmissions(monthsOld: number = 6) {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);

    const oldSubmissions = await this.prisma.insuranceSubmission.findMany({
      where: {
        status: PaymentStatus.PAID,
        paidAt: { lt: cutoffDate },
      },
      include: { people: true },
    });

    let deletedCount = 0;
    let failedCount = 0;

    for (const submission of oldSubmissions) {
      try {
        await this.deleteSubmission(submission.id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete submission ${submission.id}:`, error);
        failedCount++;
      }
    }

    return {
      success: true,
      deletedCount,
      failedCount,
      cutoffDate: cutoffDate.toISOString(),
    };
  }

  async cleanupAbandonedSubmissions(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const abandonedSubmissions = await this.prisma.insuranceSubmission.findMany(
      {
        where: {
          status: { in: [PaymentStatus.PENDING, PaymentStatus.FAILED] },
          createdAt: { lt: cutoffDate },
        },
        include: { people: true },
      },
    );

    let deletedCount = 0;
    let failedCount = 0;

    for (const submission of abandonedSubmissions) {
      try {
        await this.deleteSubmission(submission.id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete submission ${submission.id}:`, error);
        failedCount++;
      }
    }

    return {
      success: true,
      deletedCount,
      failedCount,
      cutoffDate: cutoffDate.toISOString(),
    };
  }

  async bulkDeleteSubmissions(submissionIds: string[]) {
    const results = {
      success: true,
      deletedCount: 0,
      failedCount: 0,
      errors: [] as string[],
    };

    for (const id of submissionIds) {
      try {
        await this.deleteSubmission(id);
        results.deletedCount++;
      } catch (error) {
        results.failedCount++;
        results.errors.push(`${id}: ${error.message}`);
      }
    }

    return results;
  }

  private async sendAdminNotification(submissionId: string) {
    const submission = await this.prisma.insuranceSubmission.findUnique({
      where: { id: submissionId },
      include: { people: true },
    });

    if (!submission) return;

    const settings = await this.prisma.insuranceSettings.findFirst();
    if (!settings) return;

    try {
      const baseUrl = process.env.BASE_URL || 'https://api.daudtravel.com';

      await this.mailService.sendInsuranceAdminNotification({
        submission: {
          id: submission.id,
          externalOrderId: submission.externalOrderId,
          submitterEmail: submission.submitterEmail,
          peopleCount: submission.peopleCount,
          pricePerPerson: Number(submission.pricePerPerson),
          totalAmount: Number(submission.totalAmount),
          transactionId: submission.transactionId ?? undefined,
          paymentMethod: submission.paymentMethod ?? undefined,
          paidAt: submission.paidAt ?? undefined,
        },
        people: submission.people.map((p) => ({
          id: p.id,
          fullName: p.fullName,
          phoneNumber: p.phoneNumber,
        })),
        adminEmail: settings.adminEmail,
        baseUrl,
        generateSecureViewToken: this.generateSecureViewToken.bind(this),
      });

      await this.prisma.insuranceSubmission.update({
        where: { id: submissionId },
        data: {
          emailSent: true,
          emailSentAt: new Date(),
        },
      });

      console.log(`✅ Admin notification sent for submission: ${submissionId}`);
    } catch (error) {
      console.error('❌ Failed to send admin notification:', error);
    }
  }

  private async sendCustomerConfirmation(submissionId: string) {
    const submission = await this.prisma.insuranceSubmission.findUnique({
      where: { id: submissionId },
      include: { people: true },
    });

    if (!submission) return;

    try {
      await this.mailService.sendInsuranceSubmissionConfirmation({
        email: submission.submitterEmail,
        externalOrderId: submission.externalOrderId,
        peopleCount: submission.peopleCount,
        totalAmount: Number(submission.totalAmount),
        people: submission.people.map((p) => ({
          fullName: p.fullName,
          phoneNumber: p.phoneNumber,
        })),
      });
    } catch (error) {
      console.error('❌ Failed to send customer confirmation:', error);
    }
  }
}
