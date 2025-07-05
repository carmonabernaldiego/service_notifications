import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { noLogEndpoints } from '@constants';
import { RsDiscordWebhookService } from '@common/discord/rs-discord-webhook.service';
import { LoggerService } from '@common/logger/logger.service';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggerService,
    private readonly rsDiscordWebhookService: RsDiscordWebhookService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const { originalUrl, method } = context.switchToHttp().getRequest();
    const { statusCode } = context.switchToHttp().getResponse();

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

    return next.handle().pipe(
      map((data) => {
        if (!noLogEndpoints.includes(originalUrl)) {
          const sanitizedData = Array.isArray(data)
            ? data.map((item) => ({ id: item._id })) // Solo muestra el ID en las listas
            : { id: data._id }; // Solo muestra el ID en objetos individuales

          this.logger.log(
            `${method} ${originalUrl}|Res-Code:${statusCode}|Res-Body: ${JSON.stringify(
              sanitizedData,
            )}`,
            'Response',
          );
          this.rsDiscordWebhookService.executeWebhook(
            `[${dateTime}] [LOG] [Response] ${method} ${originalUrl}|Res-Code:${statusCode}|Res-Body: ${JSON.stringify(
              sanitizedData,
            )}`,
          );
        }
        return data;
      }),
    );
  }
}
