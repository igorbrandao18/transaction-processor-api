import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from '@config/app.config';
import { logger } from '@config/logger.config';
import dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.info(`Application is running on: http://localhost:${port}`);
  logger.info(
    `Swagger documentation available at: http://localhost:${port}/api/docs`,
  );
}

void bootstrap();
