import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig, swaggerDocumentOptions, swaggerSetupOptions } from './swagger.config';

export async function configureApp(app: INestApplication): Promise<void> {
  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Setup validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Setup Swagger documentation
  const document = SwaggerModule.createDocument(app, swaggerConfig, swaggerDocumentOptions);
  SwaggerModule.setup('api/docs', app, document, swaggerSetupOptions);
}

