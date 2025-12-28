import { BullModuleOptions } from '@nestjs/bull';

export const bullmqConfig: BullModuleOptions = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    attempts: parseInt(process.env.BULLMQ_DEFAULT_ATTEMPTS || '3'),
    backoff: {
      type: 'exponential',
      delay: parseInt(process.env.BULLMQ_BACKOFF_DELAY || '2000'),
    },
    removeOnComplete: parseInt(process.env.BULLMQ_REMOVE_ON_COMPLETE || '100'),
    removeOnFail: parseInt(process.env.BULLMQ_REMOVE_ON_FAIL || '1000'),
  },
};

export const TRANSACTION_QUEUE_NAME =
  process.env.BULLMQ_QUEUE_NAME || 'transactions';
