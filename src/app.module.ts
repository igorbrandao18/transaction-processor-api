import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransactionsController } from '@controllers/transactions.controller';
import { HealthController } from '@controllers/health.controller';
import { TransactionsService } from '@services/transactions.service';
import { TransactionsRepository } from '@repositories/transactions.repository';
import { LoggerMiddleware } from '@middleware/logger.middleware';
import { bullmqConfig, TRANSACTION_QUEUE_NAME } from '@config/bullmq.config';
import { TransactionsQueue } from './queues/transactions.queue';
import { TransactionProcessor } from './processors/transaction.processor';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    BullModule.forRoot(bullmqConfig),
    BullModule.registerQueue({
      name: TRANSACTION_QUEUE_NAME,
    }),
  ],
  controllers: [AppController, TransactionsController, HealthController],
  providers: [
    AppService,
    TransactionsService,
    TransactionsRepository,
    TransactionsQueue,
    TransactionProcessor,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
