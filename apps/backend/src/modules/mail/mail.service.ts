import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST'),
      port: config.get<number>('SMTP_PORT'),
      secure: false,
      auth: { user: config.get('SMTP_USER'), pass: config.get('SMTP_PASS') },
    });
  }

  async sendOtp(email: string, code: string) {
    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM'),
      to: email,
      subject: 'Shubha Yatra Academy — Verify your email',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0D1117;color:#fff;border-radius:12px">
          <h2 style="color:#3B82F6">Shubha Yatra Academy</h2>
          <p>Your verification code is:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#3B82F6;padding:16px 0">${code}</div>
          <p style="color:#888">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      `,
    }).catch(err => this.logger.error('Mail send failed', err));
  }

  async sendWelcome(email: string, name: string) {
    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM'),
      to: email,
      subject: 'Welcome to Shubha Yatra Academy!',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0D1117;color:#fff;border-radius:12px">
          <h2 style="color:#3B82F6">Welcome, ${name}!</h2>
          <p>Your account has been verified. Start learning today!</p>
        </div>
      `,
    }).catch(err => this.logger.error('Mail send failed', err));
  }
}
