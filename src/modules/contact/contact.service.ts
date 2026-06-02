import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ContactService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async submitContact(payload: any) {
    const { name, email, subject, message } = payload;

    const emailUser = this.configService.get<string>('EMAIL_USER');
    const receiverEmail = this.configService.get<string>('CONTACT_RECEIVER_EMAIL') || this.configService.get<string>('ADMIN_EMAIL') || emailUser;

    if (!emailUser || !receiverEmail) {
      console.warn('⚠️ SMTP settings not fully defined. Skipping email dispatch.');
      return { success: true, message: 'Message logged (email skipped)' };
    }

    console.log(`✉️ Dispatching SMTP contact notification email to ${receiverEmail}...`);

    const emailHtml = `
      <div style="font-family: 'Lato', sans-serif; background-color: #FFFDF7; padding: 40px 20px; color: #1A1208; max-width: 600px; margin: 0 auto; border: 1px solid #E8DFC8;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #C9A84C; padding-bottom: 20px;">
          <h1 style="font-family: 'Playfair Display', serif; font-size: 28px; margin: 0; color: #1A1208; letter-spacing: 2px;">KIORA LIFE Style</h1>
          <span style="font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #C9A84C; display: block; margin-top: 5px;">Customer Inquiry Received</span>
        </div>
        
        <h2 style="font-family: 'Playfair Display', serif; font-size: 20px; color: #8B6914; margin-top: 0; font-weight: 500;">New Contact Form Submission</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #4A3B1F;">
          You have received a new contact inquiry from the KIORA website. Details are outlined below:
        </p>
        
        <div style="background-color: #FAF6EE; padding: 20px; border-radius: 4px; border: 1px solid #E8DFC8; margin: 20px 0; font-size: 13px; line-height: 1.8;">
          <table style="width: 100%;">
            <tr>
              <td style="color: #8A7A5A; width: 120px; font-weight: bold;">Sender Name:</td>
              <td style="color: #1A1208;">${name}</td>
            </tr>
            <tr>
              <td style="color: #8A7A5A; font-weight: bold;">Sender Email:</td>
              <td style="color: #1A1208;"><a href="mailto:${email}" style="color: #C9A84C; text-decoration: none;">${email}</a></td>
            </tr>
            <tr>
              <td style="color: #8A7A5A; font-weight: bold;">Inquiry Subject:</td>
              <td style="color: #1A1208; font-weight: bold;">${subject || 'General Inquiry'}</td>
            </tr>
          </table>
          
          <div style="margin-top: 15px; border-top: 1px solid #E8DFC8; paddingTop: 15px; font-style: italic; color: #1A1208;">
            <strong style="color: #8A7A5A; font-style: normal; display: block; margin-bottom: 5px;">Inquiry Message:</strong>
            "${message}"
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; border-top: 1px solid #E8DFC8; padding-top: 20px; font-size: 11px; color: #8A7A5A;">
          <p style="margin: 0;">© 2026 KIORA LIFE Style. All rights reserved.</p>
        </div>
      </div>
    `;

    await this.mailerService.sendMail({
      to: receiverEmail,
      from: `KIORA Website Alerts <${emailUser}>`,
      subject: `🔔 New Contact Inquiry: ${subject || 'General Scent Inquiry'}`,
      html: emailHtml,
    });

    console.log('✅ Contact form email dispatched successfully.');
    return { success: true, message: 'Your message has been sent successfully!' };
  }
}
