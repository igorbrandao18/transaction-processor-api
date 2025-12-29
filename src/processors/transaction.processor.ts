import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { TransactionsService } from '@services/transactions.service';
import type { CreateTransactionDto } from '@dto/create-transaction.dto';

@Processor('transactions')
@Injectable()
export class TransactionProcessor {
  private readonly logger = new Logger(TransactionProcessor.name);

  constructor(private readonly transactionsService: TransactionsService) {}

  @Process('process-transaction')
  async handleTransaction(job: Job<CreateTransactionDto>) {
    this.logger.log(`Processing transaction job: ${job.id}`, {
      transactionId: job.data.transactionId,
      jobId: job.id,
    });

    try {
      const transaction = await this.transactionsService.create(job.data);

      this.logger.log(`Transaction processed successfully: ${job.id}`, {
        transactionId: transaction.transactionId,
        transactionUuid: transaction.id,
        jobId: job.id,
      });

      return transaction;
    } catch (error) {
      this.logger.error(`Failed to process transaction: ${job.id}`, {
        transactionId: job.data.transactionId,
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }
}
