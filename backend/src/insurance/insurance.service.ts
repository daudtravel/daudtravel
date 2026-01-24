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

  private calculateDaysBetween(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  private getApplicableDiscount(days: number, settings: any): number {
    if (days >= 90 && settings.discount90Days > 0) {
      return Number(settings.discount90Days);
    } else if (days >= 30 && settings.discount30Days > 0) {
      return Number(settings.discount30Days);
    }
    return 0;
  }

  private calculatePersonPrice(
    days: number,
    pricePerDay: number,
    discount30Days: number,
    discount90Days: number,
  ) {
    const baseAmount = days * pricePerDay;
    const discountPercent = this.getApplicableDiscount(days, {
      discount30Days,
      discount90Days,
    });
    const discountAmount = (baseAmount * discountPercent) / 100;
    const finalAmount = baseAmount - discountAmount;

    return {
      days,
      pricePerDay,
      baseAmount,
      discount: discountPercent,
      finalAmount,
    };
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
          pricePerDay: 1.0,
          discount30Days: 0,
          discount90Days: 0,
          adminEmail: process.env.ADMIN_EMAIL || 'admin@daudtravel.com',
          isActive: true,
        },
      });
    }

    return {
      success: true,
      data: {
        id: settings.id,
        pricePerDay: Number(settings.pricePerDay),
        discount30Days: Number(settings.discount30Days),
        discount90Days: Number(settings.discount90Days),
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
        pricePerDay: dto.pricePerDay,
        discount30Days: dto.discount30Days,
        discount90Days: dto.discount90Days,
        adminEmail: dto.adminEmail,
        isActive: dto.isActive,
      },
    });

    return {
      success: true,
      data: {
        id: updated.id,
        pricePerDay: Number(updated.pricePerDay),
        discount30Days: Number(updated.discount30Days),
        discount90Days: Number(updated.discount90Days),
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

    const pricePerDay = Number(settings.pricePerDay);
    const discount30Days = Number(settings.discount30Days);
    const discount90Days = Number(settings.discount90Days);

    // Calculate pricing for each person
    const peopleWithPricing = await Promise.all(
      dto.people.map(async (person) => {
        const startDate = new Date(person.startDate);
        const endDate = new Date(person.endDate);

        // Validate dates
        if (startDate >= endDate) {
          throw new BadRequestException(
            `Invalid date range for ${person.fullName}: start date must be before end date`,
          );
        }

        const days = this.calculateDaysBetween(startDate, endDate);

        if (days < 1) {
          throw new BadRequestException(
            `Invalid date range for ${person.fullName}: minimum 1 day required`,
          );
        }

        const pricing = this.calculatePersonPrice(
          days,
          pricePerDay,
          discount30Days,
          discount90Days,
        );

        const uploaded = await this.fileUpload.uploadBase64Image(
          person.passportPhoto,
          'insurance-passports',
        );

        return {
          fullName: person.fullName,
          phoneNumber: person.phoneNumber,
          passportPhoto: uploaded.url,
          startDate,
          endDate,
          totalDays: pricing.days,
          pricePerDay: pricing.pricePerDay,
          baseAmount: pricing.baseAmount,
          discount: pricing.discount,
          finalAmount: pricing.finalAmount,
        };
      }),
    );

    // Calculate total amount and total days
    const totalAmount = peopleWithPricing.reduce(
      (sum, p) => sum + p.finalAmount,
      0,
    );
    const totalDays = peopleWithPricing.reduce(
      (sum, p) => sum + p.totalDays,
      0,
    );
    const peopleCount = dto.people.length;

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
        basket: peopleWithPricing.map((person, index) => ({
          product_id: `insurance_${index + 1}`,
          description: `Travel Insurance - ${person.fullName} (${person.totalDays} days)`,
          quantity: person.totalDays,
          unit_price: person.pricePerDay,
          total_price: person.finalAmount,
        })),
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
        peopleWithPricing.map((p) =>
          this.fileUpload.deleteFile(p.passportPhoto),
        ),
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
        totalDays,
        peopleCount,
        status: PaymentStatus.PENDING,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        people: {
          create: peopleWithPricing,
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
        totalDays: submission.totalDays,
        peopleCount: submission.peopleCount,
        people: submission.people.map((p) => ({
          fullName: p.fullName,
          days: p.totalDays,
          pricePerDay: Number(p.pricePerDay),
          baseAmount: Number(p.baseAmount),
          discount: Number(p.discount),
          finalAmount: Number(p.finalAmount),
          startDate: p.startDate.toISOString(),
          endDate: p.endDate.toISOString(),
        })),
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
            startDate: true,
            endDate: true,
            totalDays: true,
            pricePerDay: true,
            baseAmount: true,
            discount: true,
            finalAmount: true,
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
        totalDays: submission.totalDays,
        people: submission.people.map((p) => ({
          fullName: p.fullName,
          phoneNumber: p.phoneNumber,
          startDate: p.startDate.toISOString(),
          endDate: p.endDate.toISOString(),
          days: p.totalDays,
          pricePerDay: Number(p.pricePerDay),
          baseAmount: Number(p.baseAmount),
          discount: Number(p.discount),
          finalAmount: Number(p.finalAmount),
        })),
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
        totalDays: sub.totalDays,
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
          startDate: p.startDate.toISOString(),
          endDate: p.endDate.toISOString(),
          totalDays: p.totalDays,
          pricePerDay: Number(p.pricePerDay),
          baseAmount: Number(p.baseAmount),
          discount: Number(p.discount),
          finalAmount: Number(p.finalAmount),
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
        totalDays: submission.totalDays,
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
          startDate: p.startDate.toISOString(),
          endDate: p.endDate.toISOString(),
          totalDays: p.totalDays,
          pricePerDay: Number(p.pricePerDay),
          baseAmount: Number(p.baseAmount),
          discount: Number(p.discount),
          finalAmount: Number(p.finalAmount),
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
          totalDays: submission.totalDays,
          paidAt: submission.paidAt ?? undefined,
        },
        people: submission.people.map((p) => ({
          id: p.id,
          fullName: p.fullName,
          phoneNumber: p.phoneNumber,
          startDate: p.startDate,
          endDate: p.endDate,
          totalDays: p.totalDays,
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
        totalDays: submission.totalDays,
        people: submission.people.map((p) => ({
          fullName: p.fullName,
          phoneNumber: p.phoneNumber,
          startDate: p.startDate.toISOString(),
          endDate: p.endDate.toISOString(),
          days: p.totalDays,
          pricePerDay: Number(p.pricePerDay),
          baseAmount: Number(p.baseAmount),
          discount: Number(p.discount),
          finalAmount: Number(p.finalAmount),
        })),
      });
    } catch (error) {
      console.error('❌ Failed to send customer confirmation:', error);
    }
  }
}
