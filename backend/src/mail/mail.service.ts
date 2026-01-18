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
                © 2024 Daud Travel. All rights reserved.<br>
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
        
        © 2024 Daud Travel. All rights reserved.
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

  async sendInsuranceSubmissionConfirmation(emailData: {
    email: string;
    externalOrderId: string;
    peopleCount: number;
    totalAmount: number;
    people: Array<{ fullName: string; phoneNumber: string }>;
  }): Promise<void> {
    try {
      const { email, externalOrderId, peopleCount, totalAmount, people } =
        emailData;

      const peopleListHtml = people
        .map(
          (person, index) => `
        <div style="background-color: #f9f9f9; padding: 10px; margin: 5px 0; border-radius: 4px;">
          <p style="margin: 0;"><strong>Person ${index + 1}:</strong> ${person.fullName} (${person.phoneNumber})</p>
        </div>
      `,
        )
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
            <h3 style="color: #2e7d32; margin: 0 0 15px 0;">Submission Details</h3>
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${externalOrderId}</p>
            <p style="margin: 5px 0;"><strong>Number of People:</strong> ${peopleCount}</p>
            <p style="margin: 5px 0;"><strong>Total Amount Paid:</strong> ${totalAmount} GEL</p>
          </div>

          <h3 style="color: #333; margin: 20px 0 10px 0;">Insured People:</h3>
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
              © 2024 Daud Travel. All rights reserved.<br>
              This is an automated confirmation email.
            </p>
          </div>
        </div>
      </div>
    `;

      const text = `
Insurance Submission Received

Thank you! Your travel insurance submission has been successfully received and paid.

Submission Details:
- Order ID: ${externalOrderId}
- Number of People: ${peopleCount}
- Total Amount Paid: ${totalAmount} GEL

Insured People:
${people.map((person, index) => `${index + 1}. ${person.fullName} (${person.phoneNumber})`).join('\n')}

Next Steps:
Our team will process your insurance documents and send them to this email address within 24-48 hours.

If you have any questions, please reply to this email with your Order ID: ${externalOrderId}

© 2024 Daud Travel. All rights reserved.
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

      console.log(`✅ Insurance confirmation sent to: ${email}`);
    } catch (error) {
      console.error('❌ Error in sendInsuranceSubmissionConfirmation:', error);
      throw error;
    }
  }
}
