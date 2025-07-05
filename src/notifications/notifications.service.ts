import { Injectable } from '@nestjs/common';
import { MailService } from './mail.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly mailService: MailService) {}

  /**
   * Sends a custom email notification with personalized content
   * @param email Recipient's email address
   * @param subject Email subject
   * @param message Custom message body
   * @param options Optional customization for the email
   */
  async sendCustomNotification(
    email: string,
    subject: string,
    message: string,
    options?: {
      customHtmlStyle?: string;
      preHeader?: string;
      footerText?: string;
    },
  ) {
    // Default styling if no custom style is provided
    const defaultStyle = `
      font-family: Arial, sans-serif; 
      color: #333; 
      max-width: 600px; 
      margin: 0 auto;
    `;

    // Construct HTML with optional customizations
    const html = `
      <div style="${options?.customHtmlStyle || defaultStyle}">
        ${
          options?.preHeader
            ? `<p style="color: #666;">${options.preHeader}</p>`
            : ''
        }
        
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
          <h2 style="color: #2c3e50;">${subject}</h2>
          <p>${message}</p>
        </div>
        
        ${
          options?.footerText
            ? `
          <div style="margin-top: 20px; font-size: 12px; color: #888;">
            ${options.footerText}
          </div>
        `
            : ''
        }
      </div>
    `;

    // Plain text version of the message
    const text = `${subject}\n\n${message}`;

    try {
      await this.mailService.sendEmail(email, subject, text, html);
      return {
        message: 'Custom notification email sent successfully',
        status: 'success',
      };
    } catch (error) {
      console.error('Error sending custom notification:', error);
      return {
        message: 'Failed to send custom notification',
        status: 'error',
        error: error.message,
      };
    }
  }

  async notifyUserError(email: string) {
    const subject = 'Error en el inicio de sesión';
    const text = 'Su nombre de usuario o contraseña es incorrecto.';
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #d9534f;">Error en el inicio de sesión</h2>
        <p>Estimado usuario,</p>
        <p>Su nombre de usuario o contraseña es incorrecto.</p>
      </div>
    `;
    await this.mailService.sendEmail(email, subject, text, html);
    return { message: 'Notificación de error enviada correctamente.' };
  }

  async sendConfirmationCode(email: string, code: string) {
    const subject = 'Código de Confirmación';
    const text = `Su código de confirmación es: ${code}`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #5cb85c;">Código de Confirmación</h2>
        <p>Estimado usuario,</p>
        <p>Su código de confirmación es:</p>
        <p style="font-size: 24px; font-weight: bold; color: #5cb85c;">${code}</p>
      </div>
    `;
    await this.mailService.sendEmail(email, subject, text, html);
    return { message: 'Código de confirmación enviado correctamente.' };
  }

  async sendPasswordReset(email: string, code: string) {
    const subject = 'Restablecimiento de Contraseña';
    const text = `Tu código de restablecimiento de contraseña es: ${code}. Introduce este código en la aplicación para continuar con el proceso de cambio de contraseña.`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #337ab7;">Restablecimiento de Contraseña</h2>
        <p>Estimado usuario,</p>
        <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
        <p>Para continuar, por favor ingresa el siguiente código en la aplicación móvil:</p>
        <div style="text-align: center; margin-top: 20px;">
          <h3 style="font-size: 24px; font-weight: bold; color: #337ab7;">${code}</h3>
        </div>
      </div>
    `;
    await this.mailService.sendEmail(email, subject, text, html);
    return {
      message:
        'Correo de restablecimiento de contraseña enviado correctamente.',
    };
  }
}
