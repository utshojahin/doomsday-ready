import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');

  // Strict request validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  // CORS configuration
  const frontendOrigin = configService.get<string>('FRONTEND_ORIGIN', '*');
  const isWildcard = frontendOrigin === '*';
  app.enableCors({
    origin: isWildcard
      ? true
      : frontendOrigin.includes(',')
      ? frontendOrigin.split(',').map((s) => s.trim())
      : frontendOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Swagger OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Doomsday Ready API')
    .setDescription('MCU Rewatch & Opening Night Ticket Optimizer API documentation')
    .setVersion('1.0')
    .addTag('Movies')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT) || configService.get<number>('API_PORT', 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}/api`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
