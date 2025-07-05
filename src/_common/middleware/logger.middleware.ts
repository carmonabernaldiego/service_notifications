import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { noLogEndpoints } from '../constants';
import { RsDiscordWebhookService } from '@common/discord/rs-discord-webhook.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(
    private readonly logger: LoggerService,
    private readonly rsDiscordWebhookService: RsDiscordWebhookService,
  ) {}

  // Lista de claves sensibles
  private readonly sensitiveKeys = [
    'password',
    'firstName',
    'lastName',
    'email',
  ];

  // Función para enmascarar los datos sensibles
  private maskSensitiveData(body: any) {
    if (body && body.id) {
      // Si existe un id, devolvemos un objeto con solo el id
      return { id: body.id };
    }

    // Si no tiene id, recorremos el cuerpo y enmascaramos los valores sensibles
    const maskedBody = Object.keys(body).reduce((acc, key) => {
      if (this.sensitiveKeys.includes(key)) {
        // Enmascaramos los datos sensibles con un valor fijo
        acc[key] = '[SENSITIVE DATA]';
      } else {
        acc[key] = body[key];
      }
      return acc;
    }, {});

    return maskedBody;
  }

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';

    // Convertimos el cuerpo de la solicitud a un string JSON, enmascarando los datos sensibles
    const bodyStr =
      Object.keys(request.body).length !== 0
        ? JSON.stringify(this.maskSensitiveData(request.body))
        : undefined;

    // Generamos el formato de fecha y hora en español
    const dateTime = new Date(Date.now()).toLocaleDateString('es-MX', {
      weekday: 'short',
      month: '2-digit',
      year: '2-digit',
      day: 'numeric',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Comprobamos si la URL no está en la lista de exclusión
    if (!noLogEndpoints.includes(originalUrl)) {
      const logMessage = `${method} ${originalUrl}|FromIp:${ip}${
        bodyStr ? '|Req-Body: ' + bodyStr : ''
      } |Req-UserAgent:${userAgent}`;

      // Log en la consola
      this.logger.log(logMessage, 'Request');

      // Intento de ejecución del webhook de Discord
      try {
        this.rsDiscordWebhookService.executeWebhook(
          `[${dateTime}] [LOG] [Request] ${logMessage}`,
        );
      } catch (error) {
        this.logger.error(
          `Error al enviar log a Discord: ${error.message}`,
          'Webhook',
        );
      }
    }

    // Pasamos al siguiente middleware o controlador
    next();
  }
}
