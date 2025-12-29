import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app.module';
import { configureApp } from '@config/app.config';
import { logger } from '@config/logger.config';
import { runMigrations } from '@config/migrations.config';
import dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  try {
    logger.info('Running database migrations...');
    runMigrations();
    logger.info('Database migrations completed');
  } catch (error) {
    logger.error('Failed to run migrations:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  configureApp(app);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const portNumber = typeof port === 'string' ? parseInt(port, 10) : port;
  logger.info(`Application is running on: http://localhost:${portNumber}`);
  logger.info(
    `Swagger documentation available at: http://localhost:${portNumber}/api/docs`,
  );
}

void bootstrap();
