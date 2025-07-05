import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT, 10),
      secure: process.env.MAIL_ENCRYPTION === 'ssl', // `true` para SSL, `false` para TLS
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM, // Dirección de correo desde la que se envían los mensajes
        to,
        subject,
        text,
        html,
      });
      console.log('Correo enviado correctamente');
    } catch (error) {
      console.error('Error al enviar el correo:', error);
    }
  }
}
