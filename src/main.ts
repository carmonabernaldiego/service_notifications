import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { Logger, VersioningType } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Configuración de Swagger (solo para QA y DEV)
  const options = new DocumentBuilder()
    .setTitle('API Notifications AutoMaker')
    .setDescription('API Notifications AutoMaker')
    .setVersion('1.0')
    .addTag('MicroService')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('/api-docs', app, document);

  // Configurar archivos estáticos
  app
    .useStaticAssets(join(__dirname, '../public'), {
      prefix: '/api/public/',
      index: false,
      redirect: false,
    })
    .enableCors();

  // Iniciar el servidor HTTP
  await app.listen(process.env.PORT || 3000, () => {
    Logger.log(
      `Listening on port: ${process.env.PORT || 3000}`,
      'Notifications AutoMaker',
    );
  });

  // Iniciar el microservicio de RabbitMQ
  const microserviceOptions: MicroserviceOptions = {
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL')], // Conexión con RabbitMQ
      queue: 'notifications_queue',
      queueOptions: {
        durable: false,
      },
    },
  };

  app.connectMicroservice(microserviceOptions);

  await app.startAllMicroservices();
  Logger.log('Microservice running', 'RabbitMQ');
}

bootstrap();
