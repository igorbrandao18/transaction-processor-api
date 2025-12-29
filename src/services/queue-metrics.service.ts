import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { transactionsQueueSize } from '@config/metrics.config';

@Injectable()
export class QueueMetricsService implements OnModuleInit {
  constructor(@InjectQueue('transactions') private readonly queue: Queue) {}

  onModuleInit() {
    this.updateQueueMetrics();
    setInterval(() => {
      this.updateQueueMetrics();
    }, 5000);
  }

  private async updateQueueMetrics() {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        this.queue.getWaitingCount(),
        this.queue.getActiveCount(),
        this.queue.getCompletedCount(),
        this.queue.getFailedCount(),
      ]);

      transactionsQueueSize.set({ state: 'waiting' }, waiting);
      transactionsQueueSize.set({ state: 'active' }, active);
      transactionsQueueSize.set({ state: 'completed' }, completed);
      transactionsQueueSize.set({ state: 'failed' }, failed);
    } catch (error) {
      console.error('Error updating queue metrics:', error);
    }
  }
}
