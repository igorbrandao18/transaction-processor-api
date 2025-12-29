import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bull';
import type { CreateTransactionDto } from '@dto/create-transaction.dto';

@Injectable()
export class TransactionsQueue {
  constructor(@InjectQueue('transactions') private readonly queue: Queue) {}

  async addTransactionJob(
    transactionData: CreateTransactionDto,
  ): Promise<{ jobId: string; transactionId: string }> {
    const job = await this.queue.add('process-transaction', transactionData, {
      jobId: transactionData.transactionId,
    });

    return {
      jobId: job.id?.toString() || '',
      transactionId: transactionData.transactionId,
    };
  }

  async getJobStatus(transactionId: string) {
    const jobs = await this.queue.getJobs([
      'waiting',
      'active',
      'completed',
      'failed',
    ]);
    const job = jobs.find((j) => j.id === transactionId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      id: job.id,
      transactionId,
      state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  }

  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      total: waiting + active + completed + failed,
    };
  }
}
