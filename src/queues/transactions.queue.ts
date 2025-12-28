import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from '@dto/create-transaction.dto';
import { TRANSACTION_QUEUE_NAME } from '@config/bullmq.config';

@Injectable()
export class TransactionsQueue {
  constructor(
    @InjectQueue(TRANSACTION_QUEUE_NAME)
    private readonly transactionQueue: Queue<CreateTransactionDto>,
  ) {}

  async addTransaction(dto: CreateTransactionDto): Promise<void> {
    await this.transactionQueue.add('process-transaction', dto, {
      jobId: dto.transactionId, // Idempotency - same transactionId = same job
      attempts: parseInt(process.env.BULLMQ_DEFAULT_ATTEMPTS || '3'),
      backoff: {
        type: 'exponential',
        delay: parseInt(process.env.BULLMQ_BACKOFF_DELAY || '2000'),
      },
    });
  }

  async getJobStatus(transactionId: string) {
    const job = await this.transactionQueue.getJob(transactionId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress =
      typeof job.progress === 'function' ? await job.progress() : job.progress;
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    return {
      id: job.id,
      transactionId,
      state,
      progress,
      result,
      failedReason,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  }

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.transactionQueue.getWaiting(),
      this.transactionQueue.getActive(),
      this.transactionQueue.getCompleted(),
      this.transactionQueue.getFailed(),
      this.transactionQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      jobs: {
        waiting: waiting.map((job) => ({
          id: job.id,
          transactionId: job.data.transactionId,
          createdAt: new Date(job.timestamp).toISOString(),
        })),
        active: active.map((job) => ({
          id: job.id,
          transactionId: job.data.transactionId,
          createdAt: new Date(job.timestamp).toISOString(),
        })),
        delayed: delayed.map((job) => ({
          id: job.id,
          transactionId: job.data.transactionId,
          createdAt: new Date(job.timestamp).toISOString(),
          delay: (job as any).delay || 0,
        })),
      },
    };
  }
}
