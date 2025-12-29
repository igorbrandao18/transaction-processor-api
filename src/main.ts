import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from '@config/app.config';
import { logger } from '@config/logger.config';
import type { Logger } from 'winston';
import dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const portNumber = typeof port === 'string' ? parseInt(port, 10) : port;
  const winstonLogger = logger as unknown as Logger;
  winstonLogger.info(
    `Application is running on: http://localhost:${portNumber}`,
  );
  winstonLogger.info(
    `Swagger documentation available at: http://localhost:${portNumber}/api/docs`,
  );
}

void bootstrap();
