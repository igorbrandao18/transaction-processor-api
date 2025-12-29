import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransactionsController } from './controllers/transactions.controller';
import { HealthController } from './controllers/health.controller';
import { TransactionsService } from './services/transactions.service';
import { TransactionsRepository } from './repositories/transactions.repository';

@Module({
  imports: [],
  controllers: [AppController, TransactionsController, HealthController],
  providers: [AppService, TransactionsService, TransactionsRepository],
})
export class AppModule {}
