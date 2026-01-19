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

  // ============ HELPER METHODS ============

  private generateSecureViewToken(
    submissionId: string,
    personId: string,
  ): string {
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    // Token expires in 7 days
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
      // Parse token
      const [encodedPayload, signature] = token.split('.');
      if (!encodedPayload || !signature) {
        throw new BadRequestException('Invalid token format');
      }

      const payload = Buffer.from(encodedPayload, 'base64').toString('utf-8');
      const [tokenSubmissionId, tokenPersonId, expiresAt] = payload.split(':');

      // Verify signature
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      if (signature !== expectedSignature) {
        throw new BadRequestException('Invalid token signature');
      }

      // Check expiration
      if (Date.now() > parseInt(expiresAt)) {
        throw new BadRequestException('Token expired');
      }

      // Verify IDs match
      if (tokenSubmissionId !== submissionId || tokenPersonId !== personId) {
        throw new BadRequestException('Token mismatch');
      }

      // Get person and photo
      const person = await this.prisma.insurancePerson.findUnique({
        where: { id: personId },
        include: { submission: true },
      });

      if (!person || person.submissionId !== submissionId) {
        throw new NotFoundException('Photo not found');
      }

      // Return the photo file
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

  // ============ SETTINGS MANAGEMENT ============

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

    // Calculate total amount
    const peopleCount = dto.people.length;
    const pricePerPerson = Number(settings.pricePerPerson);
    const totalAmount = peopleCount * pricePerPerson;

    // Upload passport photos
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

      // Cleanup uploaded images on payment creation failure
      await Promise.all(
        uploadedPeople.map((p) => this.fileUpload.deleteFile(p.passportPhoto)),
      );

      throw new InternalServerErrorException('Failed to create payment');
    }

    const bogOrderData = await bogResponse.json();

    // Create submission in database
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

    // Send email notification to admin on successful payment
    if (finalStatus === PaymentStatus.PAID && !submission.emailSent) {
      await this.sendAdminNotification(submission.id);
      await this.sendCustomerConfirmation(submission.id);
    }

    return {
      success: true,
      status: finalStatus,
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

      // Build people details HTML with secure links
      const peopleDetailsHtml = submission.people
        .map((person, index) => {
          // Generate secure token for this specific photo
          const viewToken = this.generateSecureViewToken(
            submission.id,
            person.id,
          );
          const securePhotoUrl = `${baseUrl}/api/insurance/view-passport/${submission.id}/${person.id}?token=${viewToken}`;

          return `
        <div style="background-color: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #2196F3;">
          <h4 style="color: #333; margin: 0 0 10px 0;">Person ${index + 1}</h4>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${person.fullName}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${person.phoneNumber}</p>
          <p style="margin: 10px 0;">
            <a href="${securePhotoUrl}" 
               target="_blank" 
               style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 5px;">
              🔒 View Secure Photo
            </a>
            <span style="display: block; margin-top: 5px; font-size: 12px; color: #666;">
              (Link expires in 7 days)
            </span>
          </p>
        </div>
      `;
        })
        .join('');

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2196F3; margin-bottom: 10px;">New Insurance Submission</h1>
              <div style="width: 60px; height: 4px; background-color: #2196F3; margin: 0 auto;"></div>
            </div>
            
            <div style="background-color: #e7f3fe; border-left: 4px solid #2196F3; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #1565c0; margin: 0 0 15px 0;">Payment Details</h3>
              <p style="margin: 5px 0;"><strong>Order ID:</strong> ${submission.externalOrderId}</p>
              <p style="margin: 5px 0;"><strong>Submitter Email:</strong> ${submission.submitterEmail}</p>
              <p style="margin: 5px 0;"><strong>Number of People:</strong> ${submission.peopleCount}</p>
              <p style="margin: 5px 0;"><strong>Price per Person:</strong> ${submission.pricePerPerson} GEL</p>
              <p style="margin: 5px 0;"><strong>Total Amount:</strong> ${submission.totalAmount} GEL</p>
              ${submission.transactionId ? `<p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${submission.transactionId}</p>` : ''}
              ${submission.paymentMethod ? `<p style="margin: 5px 0;"><strong>Payment Method:</strong> ${submission.paymentMethod}</p>` : ''}
            </div>

            <h3 style="color: #333; margin: 30px 0 15px 0;">Submitted People Details</h3>
            ${peopleDetailsHtml}

            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 4px;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                📧 <strong>Reply to submitter:</strong> ${submission.submitterEmail}
              </p>
            </div>

            <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #2e7d32; margin: 0; font-size: 13px;">
                🔒 <strong>Security Note:</strong> Photo links are secured and expire after 7 days
              </p>
            </div>

            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                Paid on ${submission.paidAt?.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      `;

      const text = `
New Insurance Submission Received

Payment Details:
- Order ID: ${submission.externalOrderId}
- Submitter Email: ${submission.submitterEmail}
- Number of People: ${submission.peopleCount}
- Price per Person: ${submission.pricePerPerson} GEL
- Total Amount: ${submission.totalAmount} GEL
${submission.transactionId ? `- Transaction ID: ${submission.transactionId}` : ''}
${submission.paymentMethod ? `- Payment Method: ${submission.paymentMethod}` : ''}

Submitted People:
${submission.people
  .map((person, index) => {
    const viewToken = this.generateSecureViewToken(submission.id, person.id);
    const securePhotoUrl = `${baseUrl}/api/insurance/view-passport/${submission.id}/${person.id}?token=${viewToken}`;

    return `
Person ${index + 1}:
- Name: ${person.fullName}
- Phone: ${person.phoneNumber}
- Passport Photo: ${securePhotoUrl} (expires in 7 days)
`;
  })
  .join('\n')}

Reply to submitter: ${submission.submitterEmail}

Paid on ${submission.paidAt?.toLocaleString()}
      `.trim();

      await this.mailService.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@daudtravel.com',
        to: [settings.adminEmail],
        replyTo: submission.submitterEmail,
        subject: `🆕 Insurance Submission - ${submission.externalOrderId}`,
        html,
        text,
      });

      // Mark email as sent
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

      console.log(
        `✅ Customer confirmation sent to: ${submission.submitterEmail}`,
      );
    } catch (error) {
      console.error('❌ Failed to send customer confirmation:', error);
    }
  }

  // ============ QUERY METHODS ============

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

    // Delete all passport photos from storage
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

    // Delete submission (cascade will delete people records)
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

  async getStorageStats() {
    const [total, paid, pending, failed] = await Promise.all([
      this.prisma.insuranceSubmission.count(),
      this.prisma.insuranceSubmission.count({
        where: { status: PaymentStatus.PAID },
      }),
      this.prisma.insuranceSubmission.count({
        where: { status: PaymentStatus.PENDING },
      }),
      this.prisma.insuranceSubmission.count({
        where: { status: PaymentStatus.FAILED },
      }),
    ]);

    const totalPeople = await this.prisma.insurancePerson.count();

    return {
      success: true,
      submissions: {
        total,
        paid,
        pending,
        failed,
      },
      totalPeople,
      estimatedStorageFiles: totalPeople,
    };
  }
}
