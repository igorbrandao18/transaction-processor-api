import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from '@filters/http-exception.filter';
import { validationPipeConfig } from '@config/validation.config';
import {
  swaggerConfig,
  swaggerDocumentOptions,
  swaggerSetupOptions,
} from '@config/swagger.config';
import { testConnection } from '@config/database.config';
import { logger } from '@config/logger.config';

export async function configureApp(app: INestApplication): Promise<void> {
  app.useGlobalPipes(validationPipeConfig);

  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors();

  const document = SwaggerModule.createDocument(
    app,
    swaggerConfig,
    swaggerDocumentOptions,
  );
  SwaggerModule.setup('api/docs', app, document, swaggerSetupOptions);

  try {
    await testConnection();
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    process.exit(1);
  }
}
