import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

export interface EmailData {
  firstName: string;
  lastName: string;
  email: string;
}

@Injectable()
export class MailService {
  public resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not defined in environment variables');
    }
    this.resend = new Resend(apiKey);
  }

  async sendPaymentSuccessEmail(
    emailData: EmailData & { detailsLink: string },
  ): Promise<void> {
    try {
      const { firstName, lastName, email, detailsLink } = emailData;
      const subject = 'Tour Purchase Confirmation 🎉';
      const message =
        "Congratulations! You've purchased our tour. You can view all the details using the link below:";

      const text = `${message}\n\n${detailsLink}`;

      const html = `
        <div style="font-family: Arial, sans-serif; font-size: 16px; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>${message}</p>
          <p><a href="${detailsLink}" style="color: #1e88e5;" target="_blank">${detailsLink}</a></p>
          <p>— ${firstName} ${lastName}</p>
        </div>
      `;

      const { data, error } = await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@daudtravel.com',
        to: [email, 'traveldaud@gmail.com'],
        subject,
        text,
        html,
      });

      if (error) {
        console.error('❌ Error sending payment success email:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Error in sendPaymentSuccessEmail:', error);
      throw error;
    }
  }

  async sendTourBookingConfirmation(
    emailData: EmailData & {
      tourName: string;
      bookingDate: string;
      peopleAmount: number;
      detailsLink: string;
    },
  ): Promise<void> {
    try {
      const {
        firstName,
        lastName,
        email,
        tourName,
        bookingDate,
        peopleAmount,
        detailsLink,
      } = emailData;
      const subject = `Tour Booking Confirmation - ${tourName}`;

      const html = `
        <div style="font-family: Arial, sans-serif; font-size: 16px; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e88e5;">Tour Booking Confirmed!</h2>
          <p>Dear ${firstName} ${lastName},</p>
          <p>Thank you for booking with us. Your tour reservation has been confirmed.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Tour:</strong> ${tourName}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${bookingDate}</p>
            <p style="margin: 5px 0;"><strong>Number of People:</strong> ${peopleAmount}</p>
          </div>

          <p>View your booking details:</p>
          <p><a href="${detailsLink}" style="color: #1e88e5; text-decoration: none;" target="_blank">${detailsLink}</a></p>
          
          <p style="margin-top: 30px;">Best regards,<br/>Daud Travel Team</p>
        </div>
      `;

      const text = `
Dear ${firstName} ${lastName},

Thank you for booking with us. Your tour reservation has been confirmed.

Tour: ${tourName}
Date: ${bookingDate}
Number of People: ${peopleAmount}

View your booking details: ${detailsLink}

Best regards,
Daud Travel Team
      `;

      const { data, error } = await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@daudtravel.com',
        to: [email, 'traveldaud@gmail.com'],
        subject,
        text,
        html,
      });

      if (error) {
        console.error('❌ Error sending booking confirmation email:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Error in sendTourBookingConfirmation:', error);
      throw error;
    }
  }

  async sendPaymentFailureEmail(
    emailData: EmailData & {
      tourName: string;
      reason?: string;
    },
  ): Promise<void> {
    try {
      const { firstName, lastName, email, tourName, reason } = emailData;
      const subject = 'Payment Failed - Action Required';

      const html = `
        <div style="font-family: Arial, sans-serif; font-size: 16px; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #d32f2f;">Payment Failed</h2>
          <p>Dear ${firstName} ${lastName},</p>
          <p>Unfortunately, your payment for <strong>${tourName}</strong> could not be processed.</p>
          
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          
          <p>Please try again or contact our support team for assistance.</p>
          
          <p style="margin-top: 30px;">Best regards,<br/>Daud Travel Team</p>
        </div>
      `;

      const text = `
Dear ${firstName} ${lastName},

Unfortunately, your payment for ${tourName} could not be processed.

${reason ? `Reason: ${reason}` : ''}

Please try again or contact our support team for assistance.

Best regards,
Daud Travel Team
      `;

      const { data, error } = await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@daudtravel.com',
        to: [email],
        subject,
        text,
        html,
      });

      if (error) {
        console.error('❌ Error sending payment failure email:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Error in sendPaymentFailureEmail:', error);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'traveldaud@gmail.com',
        to: email,
        subject: 'Verify Your Daud Travel Account',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin-bottom: 10px;">Email Verification</h1>
              <div style="width: 60px; height: 4px; background-color: #2196F3; margin: 0 auto;"></div>
            </div>
            
            <p style="color: #666; line-height: 1.6; text-align: center; font-size: 16px;">
              Thank you for signing up with <strong>Daud Travel</strong>. To complete your registration, please use the verification code below:
            </p>
            
            <div style="background-color: #e7f3fe; border: 2px solid #2196F3; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
              <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your verification code:</p>
              <p style="font-size: 32px; color: #2196F3; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                ${code}
              </p>
            </div>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                ⏰ <strong>Important:</strong> This code will expire in 15 minutes for security reasons.
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; text-align: center; font-size: 14px;">
              If you did not create an account with Daud Travel, please ignore this email and no action will be taken.
            </p>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                © 2025 Daud Travel. All rights reserved.<br>
                This is an automated message, please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `,
        text: `
        Welcome to Daud Travel!
        
        Your verification code is: ${code}
        
        This code will expire in 15 minutes.
        
        If you did not create an account with Daud Travel, please ignore this email.
        
        © 2025 Daud Travel. All rights reserved.
      `,
      });

      if (error) {
        console.error(
          `❌ Failed to send verification email to ${email}`,
          error,
        );
        throw new Error('Failed to send verification email. Please try again.');
      }
    } catch (error) {
      console.error(`❌ Failed to send verification email to ${email}`, error);
      throw new Error('Failed to send verification email. Please try again.');
    }
  }

  async sendTransferPaymentSuccessEmail(
    emailData: EmailData & { detailsLink: string },
  ): Promise<void> {
    try {
      const { firstName, lastName, email, detailsLink } = emailData;
      const subject = 'Transfer Booking Confirmation 🚗';
      const message =
        "Congratulations! You've successfully booked your transfer. You can view all the details using the link below:";

      const text = `${message}\n\n${detailsLink}`;

      const html = `
      <div style="font-family: Arial, sans-serif; font-size: 16px; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>${message}</p>
        <p><a href="${detailsLink}" style="color: #1e88e5;" target="_blank">${detailsLink}</a></p>
        <p>— ${firstName} ${lastName}</p>
      </div>
    `;

      const { data, error } = await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@daudtravel.com',
        to: [email, 'traveldaud@gmail.com'],
        subject,
        text,
        html,
      });

      if (error) {
        console.error(
          '❌ Error sending transfer payment success email:',
          error,
        );
        throw error;
      }
    } catch (error) {
      console.error('❌ Error in sendTransferPaymentSuccessEmail:', error);
      throw error;
    }
  }

  async sendInsuranceAdminNotification(emailData: {
    submission: {
      id: string;
      externalOrderId: string;
      submitterEmail: string;
      peopleCount: number;
      totalDays: number;
      paidAt?: Date;
    };
    people: Array<{
      id: string;
      fullName: string;
      phoneNumber: string;
      passportPhotoUrl: string;
      startDate: Date;
      endDate: Date;
      totalDays: number;
    }>;
    adminEmail: string;
    baseUrl: string;
  }): Promise<void> {
    const { submission, people, adminEmail, baseUrl } = emailData;

    try {
      const peopleDetailsHtml = people
        .map((person, index) => {
          const securePhotoUrl = `${baseUrl}/api/insurance/view-passport/${submission.id}/${person.id}`;

          return `
      <div style="background-color: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #2196F3;">
        <h4 style="color: #333; margin: 0 0 10px 0;">
          Person ${index + 1}: ${person.fullName}
        </h4>
        <p style="margin: 5px 0; color: #666;"><strong>Phone:</strong> ${person.phoneNumber}</p>
        <p style="margin: 5px 0; color: #666;">
          <strong>Coverage Period:</strong> 
          ${person.startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} - 
          ${person.endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        </p>
        <p style="margin: 5px 0; color: #666;"><strong>Duration:</strong> ${person.totalDays} days</p>

        <p style="margin: 10px 0;">
          <a href="${securePhotoUrl}" 
             target="_blank" 
             style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 5px;">
            🔒 View Passport Photo
          </a>
          <span style="display: block; margin-top: 5px; font-size: 12px; color: #666;">
            (Password required!)
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
          <h1 style="color: #2196F3; margin-bottom: 10px;">🆕 New Insurance Submission</h1>
          <div style="width: 60px; height: 4px; background-color: #2196F3; margin: 0 auto;"></div>
        </div>
        
        <div style="background-color: #e7f3fe; border-left: 4px solid #2196F3; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #1565c0; margin: 0 0 15px 0;">Submission Summary</h3>
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${submission.externalOrderId}</p>
          <p style="margin: 5px 0;"><strong>Submitter Email:</strong> ${submission.submitterEmail}</p>
          <p style="margin: 5px 0;"><strong>Number of People:</strong> ${submission.peopleCount}</p>
          <p style="margin: 5px 0;"><strong>Total Coverage Days:</strong> ${submission.totalDays} days</p>
        </div>

        <h3 style="color: #333; margin: 30px 0 15px 0;">Insured Individuals</h3>
        ${peopleDetailsHtml}

        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 4px;">
          <p style="color: #856404; margin: 0; font-size: 14px;">
            📧 <strong>Reply to submitter:</strong> ${submission.submitterEmail}
          </p>
        </div>

        <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="color: #2e7d32; margin: 0; font-size: 13px;">
            🔒 <strong>Security Note:</strong> Photos require authentication 
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

Submission Summary:
- Order ID: ${submission.externalOrderId}
- Submitter Email: ${submission.submitterEmail}
- Number of People: ${submission.peopleCount}
- Total Coverage Days: ${submission.totalDays} days

Insured Individuals:
${people
  .map((person, index) => {
    const securePhotoUrl = `${baseUrl}/api/insurance/view-passport/${submission.id}/${person.id}`;

    return `
Person ${index + 1}: ${person.fullName}
- Phone: ${person.phoneNumber}
- Coverage: ${person.startDate.toLocaleDateString()} to ${person.endDate.toLocaleDateString()}
- Duration: ${person.totalDays} days
- Passport Photo: ${securePhotoUrl} (password?!)
`;
  })
  .join('\n')}

Reply to submitter: ${submission.submitterEmail}

Paid on ${submission.paidAt?.toLocaleString()}
  `.trim();

      await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@daudtravel.com',
        to: [adminEmail],
        replyTo: submission.submitterEmail,
        subject: `🆕 Insurance Submission - ${submission.externalOrderId} (${submission.peopleCount} ${submission.peopleCount === 1 ? 'person' : 'people'})`,
        html,
        text,
      });
    } catch (error) {
      console.error('❌ Failed to send admin notification:', error);
      throw error;
    }
  }
  async sendQuickPaymentCustomerConfirmation(emailData: {
    email: string;
    customerFullName: string;
    externalOrderId: string;
    productName: string;
    productDescription?: string;
    quantity: number;
    totalAmount: number;
  }): Promise<void> {
    try {
      const {
        email,
        customerFullName,
        externalOrderId,
        productName,
        productDescription,
        quantity,
        totalAmount,
      } = emailData;

      const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4caf50; margin-bottom: 10px;">✅ Payment Successful</h1>
          <div style="width: 60px; height: 4px; background-color: #4caf50; margin: 0 auto;"></div>
        </div>
        
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          Dear ${customerFullName},
        </p>
        
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          Thank you for your payment! Your order has been successfully processed.
        </p>

        <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #2e7d32; margin: 0 0 15px 0;">Order Summary</h3>
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${externalOrderId}</p>
          <p style="margin: 5px 0;"><strong>Product:</strong> ${productName}</p>
          ${productDescription ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${productDescription}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Quantity:</strong> ${quantity}</p>
          <p style="margin: 5px 0; font-size: 18px; color: #2e7d32;"><strong>Total Paid:</strong> ₾${totalAmount.toFixed(2)}</p>
        </div>

        <p style="color: #666; line-height: 1.6; font-size: 14px;">
          If you have any questions, please contact us with your Order ID.
        </p>

        <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            © 2025 Daud Travel. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `;

      const text = `
Payment Successful

Dear ${customerFullName},

Thank you for your payment! Your order has been successfully processed.

Order Summary:
- Order ID: ${externalOrderId}
- Product: ${productName}
${productDescription ? `- Description: ${productDescription}\n` : ''}- Quantity: ${quantity}
- Total Paid: ₾${totalAmount.toFixed(2)}

If you have any questions, please contact us with your Order ID.

© 2025 Daud Travel. All rights reserved.
    `.trim();

      await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@daudtravel.com',
        to: [email],
        subject: `Payment Confirmation - ${externalOrderId}`,
        html,
        text,
      });
    } catch (error) {
      console.error('❌ Error sending quick payment confirmation:', error);
      throw error;
    }
  }

  async sendQuickPaymentAdminNotification(emailData: {
    order: {
      id: string;
      externalOrderId: string;
      customerFullName: string;
      customerEmail?: string;
      customerPhone?: string;
      productName: string;
      productDescription?: string;
      quantity: number;
      totalAmount: number;
      transactionId?: string;
      paymentMethod?: string;
      paidAt?: Date;
    };
    adminEmail: string;
  }): Promise<void> {
    const { order, adminEmail } = emailData;

    try {
      const html = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2196F3; margin-bottom: 10px;">🆕 New Quick Payment Order</h1>
          <div style="width: 60px; height: 4px; background-color: #2196F3; margin: 0 auto;"></div>
        </div>
        
        <div style="background-color: #e7f3fe; border-left: 4px solid #2196F3; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #1565c0; margin: 0 0 15px 0;">Order Details</h3>
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order.externalOrderId}</p>
          <p style="margin: 5px 0;"><strong>Customer:</strong> ${order.customerFullName}</p>
          ${order.customerEmail ? `<p style="margin: 5px 0;"><strong>Email:</strong> ${order.customerEmail}</p>` : ''}
          ${order.customerPhone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${order.customerPhone}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Product:</strong> ${order.productName}</p>
          ${order.productDescription ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${order.productDescription}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Quantity:</strong> ${order.quantity}</p>
          <p style="margin: 5px 0; font-size: 18px; color: #1565c0;"><strong>Total Amount:</strong> ₾${order.totalAmount.toFixed(2)}</p>
          ${order.transactionId ? `<p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${order.transactionId}</p>` : ''}
          ${order.paymentMethod ? `<p style="margin: 5px 0;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>` : ''}
        </div>

        ${
          order.customerEmail
            ? `
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 4px;">
          <p style="color: #856404; margin: 0; font-size: 14px;">
            📧 <strong>Reply to customer:</strong> ${order.customerEmail}
          </p>
        </div>
        `
            : ''
        }

        <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            Paid on ${order.paidAt?.toLocaleDateString('en-US', {
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
New Quick Payment Order

Order Details:
- Order ID: ${order.externalOrderId}
- Customer: ${order.customerFullName}
${order.customerEmail ? `- Email: ${order.customerEmail}\n` : ''}${order.customerPhone ? `- Phone: ${order.customerPhone}\n` : ''}- Product: ${order.productName}
${order.productDescription ? `- Description: ${order.productDescription}\n` : ''}- Quantity: ${order.quantity}
- Total Amount: ₾${order.totalAmount.toFixed(2)}
${order.transactionId ? `- Transaction ID: ${order.transactionId}\n` : ''}${order.paymentMethod ? `- Payment Method: ${order.paymentMethod}\n` : ''}

${order.customerEmail ? `Reply to customer: ${order.customerEmail}\n` : ''}
Paid on ${order.paidAt?.toLocaleString()}
    `.trim();

      await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@daudtravel.com',
        to: [adminEmail],
        replyTo: order.customerEmail,
        subject: `🆕 Quick Payment Order - ${order.externalOrderId}`,
        html,
        text,
      });
    } catch (error) {
      console.error('❌ Failed to send admin notification:', error);
      throw error;
    }
  }

  async sendInsuranceSubmissionConfirmation(emailData: {
    email: string;
    externalOrderId: string;
    peopleCount: number;
    totalAmount: number;
    totalDays: number;
    people: Array<{
      fullName: string;
      phoneNumber: string;
      startDate: string;
      endDate: string;
      days: number;
      pricePerDay: number;
      baseAmount: number;
      discount: number;
      finalAmount: number;
    }>;
  }): Promise<void> {
    try {
      const {
        email,
        externalOrderId,
        peopleCount,
        totalAmount,
        totalDays,
        people,
      } = emailData;

      const peopleListHtml = people
        .map((person, index) => {
          const discountText =
            person.discount > 0
              ? `<span style="color: #4caf50; font-weight: bold;">(${person.discount}% discount applied)</span>`
              : '';

          return `
      <div style="background-color: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #2196F3;">
        <h4 style="margin: 0 0 10px 0; color: #333;">Person ${index + 1}: ${person.fullName}</h4>
        <p style="margin: 5px 0; color: #666;"><strong>Phone:</strong> ${person.phoneNumber}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Coverage Period:</strong> ${new Date(person.startDate).toLocaleDateString()} - ${new Date(person.endDate).toLocaleDateString()}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Duration:</strong> ${person.days} days</p>
        <div style="background-color: #e3f2fd; padding: 10px; margin-top: 10px; border-radius: 4px;">
          <p style="margin: 3px 0; font-size: 14px; color: #555;">
            ${person.days} days × ${person.pricePerDay} GEL/day = ${person.baseAmount} GEL
          </p>
          ${
            person.discount > 0
              ? `
            <p style="margin: 3px 0; font-size: 14px; color: #4caf50;">
              Discount (${person.discount}%): -${(person.baseAmount - person.finalAmount).toFixed(2)} GEL
            </p>
          `
              : ''
          }
          <p style="margin: 3px 0; font-size: 15px; font-weight: bold; color: #1976d2;">
            Final Amount: ${person.finalAmount} GEL ${discountText}
          </p>
        </div>
      </div>
    `;
        })
        .join('');

      const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
    <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4caf50; margin-bottom: 10px;">✅ Insurance Submission Received</h1>
        <div style="width: 60px; height: 4px; background-color: #4caf50; margin: 0 auto;"></div>
      </div>
      
      <p style="color: #666; line-height: 1.6; font-size: 16px;">
        Thank you! Your travel insurance submission has been successfully received and paid.
      </p>

      <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <h3 style="color: #2e7d32; margin: 0 0 15px 0;">Submission Summary</h3>
        <p style="margin: 5px 0;"><strong>Order ID:</strong> ${externalOrderId}</p>
        <p style="margin: 5px 0;"><strong>Number of People:</strong> ${peopleCount}</p>
        <p style="margin: 5px 0;"><strong>Total Coverage Days:</strong> ${totalDays} days</p>
        <p style="margin: 5px 0; font-size: 18px; color: #2e7d32;"><strong>Total Amount Paid:</strong> ${totalAmount.toFixed(2)} GEL</p>
      </div>

      <h3 style="color: #333; margin: 20px 0 10px 0;">Coverage Details:</h3>
      ${peopleListHtml}

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 4px;">
        <p style="color: #856404; margin: 0; font-size: 14px;">
          📧 <strong>Next Steps:</strong> Our team will process your insurance documents and send them to this email address within 24-48 hours.
        </p>
      </div>

      <p style="color: #666; line-height: 1.6; font-size: 14px; text-align: center;">
        If you have any questions, please reply to this email with your Order ID: <strong>${externalOrderId}</strong>
      </p>

      <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
          © 2025 Daud Travel. All rights reserved.<br>
          This is an automated confirmation email.
        </p>
      </div>
    </div>
  </div>
`;

      const text = `
Insurance Submission Received

Thank you! Your travel insurance submission has been successfully received and paid.

Submission Summary:
- Order ID: ${externalOrderId}
- Number of People: ${peopleCount}
- Total Coverage Days: ${totalDays} days
- Total Amount Paid: ${totalAmount.toFixed(2)} GEL

Coverage Details:
${people
  .map((person, index) => {
    const discountText =
      person.discount > 0
        ? ` (${person.discount}% discount applied - saved ${(person.baseAmount - person.finalAmount).toFixed(2)} GEL)`
        : '';

    return `
Person ${index + 1}: ${person.fullName}
- Phone: ${person.phoneNumber}
- Coverage: ${new Date(person.startDate).toLocaleDateString()} to ${new Date(person.endDate).toLocaleDateString()}
- Duration: ${person.days} days
- Price: ${person.days} days × ${person.pricePerDay} GEL/day = ${person.baseAmount} GEL
- Final Amount: ${person.finalAmount} GEL${discountText}
`;
  })
  .join('\n')}

Next Steps:
Our team will process your insurance documents and send them to this email address within 24-48 hours.

If you have any questions, please reply to this email with your Order ID: ${externalOrderId}

© 2025 Daud Travel. All rights reserved.
`.trim();

      const { data, error } = await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@daudtravel.com',
        to: [email],
        subject: `Insurance Submission Confirmed - ${externalOrderId}`,
        html,
        text,
      });

      if (error) {
        console.error('❌ Error sending insurance confirmation email:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Error in sendInsuranceSubmissionConfirmation:', error);
      throw error;
    }
  }
}
