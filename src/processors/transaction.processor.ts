import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { TransactionsService } from '@services/transactions.service';
import type { CreateTransactionDto } from '@dto/create-transaction.dto';
import { TransactionStatus } from '@entities/transaction.entity';
import { transactionsProcessed } from '@config/metrics.config';

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

      // Update status to completed after successful processing
      const completedTransaction = await this.transactionsService.updateStatus(
        transaction.id,
        TransactionStatus.COMPLETED,
      );

      transactionsProcessed.inc({ status: 'success' });

      this.logger.log(`Transaction processed successfully: ${job.id}`, {
        transactionId: completedTransaction.transactionId,
        transactionUuid: completedTransaction.id,
        jobId: job.id,
        status: completedTransaction.status,
      });

      return completedTransaction;
    } catch (error) {
      transactionsProcessed.inc({ status: 'error' });

      // Try to update status to failed if transaction exists
      try {
        const existingTransaction =
          await this.transactionsService.findByTransactionId(
            job.data.transactionId,
          );
        if (
          existingTransaction &&
          existingTransaction.status === TransactionStatus.PENDING
        ) {
          await this.transactionsService.updateStatus(
            existingTransaction.id,
            TransactionStatus.FAILED,
          );
        }
      } catch (updateError) {
        this.logger.warn(
          `Could not update transaction status to failed: ${job.id}`,
          {
            transactionId: job.data.transactionId,
            error:
              updateError instanceof Error
                ? updateError.message
                : 'Unknown error',
          },
        );
      }

      this.logger.error(`Failed to process transaction: ${job.id}`, {
        transactionId: job.data.transactionId,
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }
}
