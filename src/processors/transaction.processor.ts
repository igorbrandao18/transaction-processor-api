import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { TransactionsService } from '@services/transactions.service';
import { CreateTransactionDto } from '@dto/create-transaction.dto';
import { TRANSACTION_QUEUE_NAME } from '@config/bullmq.config';
import { TransactionStatus } from '@entities/transaction.entity';
import { logger } from '@config/logger.config';

@Processor(TRANSACTION_QUEUE_NAME)
@Injectable()
export class TransactionProcessor {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Process('process-transaction')
  async handleTransaction(job: Job<CreateTransactionDto>) {
    const { transactionId, amount, currency, type } = job.data;

    logger.info('Processing transaction from queue', {
      jobId: job.id,
      transactionId,
      attempt: job.attemptsMade + 1,
    });

    try {
      const transaction = await this.transactionsService.create({
        transactionId,
        amount,
        currency,
        type,
      });

      const completedTransaction = await this.transactionsService.updateStatus(
        transaction.id,
        TransactionStatus.COMPLETED,
      );

      logger.info('Transaction processed successfully', {
        jobId: job.id,
        transactionId,
        transactionStatus: completedTransaction.status,
      });

      return completedTransaction;
    } catch (error) {
      if (error?.response?.error !== 'Transaction already exists') {
        try {
          const existingTransaction =
            await this.transactionsService.findByTransactionId(transactionId);
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
          logger.warn('Could not update transaction status to failed', {
            transactionId,
            error: updateError.message,
          });
        }
      }

      logger.error('Failed to process transaction', {
        jobId: job.id,
        transactionId,
        error: error.message,
        attempt: job.attemptsMade + 1,
      });

      throw error;
    }
  }
}
