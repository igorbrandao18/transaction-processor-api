import { bullmqConfig, TRANSACTION_QUEUE_NAME } from '@config/bullmq.config';

describe('bullmq.config', () => {
  describe('bullmqConfig', () => {
    it('should export bullmqConfig', () => {
      expect(bullmqConfig).toBeDefined();
      expect(bullmqConfig.redis).toBeDefined();
      expect(bullmqConfig.defaultJobOptions).toBeDefined();
    });

    it('should have Redis configuration', () => {
      expect(bullmqConfig.redis).toBeDefined();
      expect(bullmqConfig.redis.host).toBeDefined();
      expect(bullmqConfig.redis.port).toBeDefined();
    });

    it('should have default job options configured', () => {
      expect(bullmqConfig.defaultJobOptions).toBeDefined();
      expect(bullmqConfig.defaultJobOptions.attempts).toBeDefined();
      expect(bullmqConfig.defaultJobOptions.backoff).toBeDefined();
      expect(bullmqConfig.defaultJobOptions.backoff.type).toBe('exponential');
    });

    it('should have removeOnComplete and removeOnFail configured', () => {
      expect(bullmqConfig.defaultJobOptions.removeOnComplete).toBeDefined();
      expect(bullmqConfig.defaultJobOptions.removeOnFail).toBeDefined();
    });
  });

  describe('TRANSACTION_QUEUE_NAME', () => {
    it('should export TRANSACTION_QUEUE_NAME', () => {
      expect(TRANSACTION_QUEUE_NAME).toBeDefined();
      expect(typeof TRANSACTION_QUEUE_NAME).toBe('string');
    });

    it('should have a valid queue name', () => {
      expect(TRANSACTION_QUEUE_NAME.length).toBeGreaterThan(0);
    });
  });
});
