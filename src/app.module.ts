import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AppController } from '@app.controller';
import { AppService } from '@app.service';
import { TransactionsController } from '@controllers/transactions.controller';
import { HealthController } from '@controllers/health.controller';
import { MetricsController } from '@controllers/metrics.controller';
import { TransactionsService } from '@services/transactions.service';
import { TransactionsRepository } from '@repositories/transactions.repository';
import { TransactionsQueue } from '@queues/transactions.queue';
import { TransactionProcessor } from '@processors/transaction.processor';
import { MetricsMiddleware } from '@middleware/metrics.middleware';
import { QueueMetricsService } from '@services/queue-metrics.service';
import { PrismaService } from '@config/prisma.service';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    BullModule.registerQueue({
      name: 'transactions',
      defaultJobOptions: {
        attempts: parseInt(process.env.BULLMQ_DEFAULT_ATTEMPTS || '3', 10),
        backoff: {
          type: 'exponential',
          delay: parseInt(process.env.BULLMQ_BACKOFF_DELAY || '2000', 10),
        },
        removeOnComplete: parseInt(
          process.env.BULLMQ_REMOVE_ON_COMPLETE || '100',
          10,
        ),
        removeOnFail: parseInt(process.env.BULLMQ_REMOVE_ON_FAIL || '1000', 10),
      },
    }),
  ],
  controllers: [
    AppController,
    TransactionsController,
    HealthController,
    MetricsController,
  ],
  providers: [
    AppService,
    PrismaService,
    TransactionsService,
    TransactionsRepository,
    TransactionsQueue,
    TransactionProcessor,
    MetricsMiddleware,
    QueueMetricsService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
