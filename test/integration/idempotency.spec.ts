import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@app.module';
import { dbPool } from '@config/database.config';
import { TransactionType } from '@entities/transaction.entity';
import { getQueueToken } from '@nestjs/bull';
import type { Queue } from 'bull';
import { TRANSACTION_QUEUE_NAME } from '@config/bullmq.config';
import { TransactionProcessor } from '@processors/transaction.processor';
import {
  waitForJobsToComplete,
  processAllWaitingJobs,
  clearQueue,
} from '@test-helpers/bullmq-test.helper';

describe('Idempotency Integration Tests', () => {
  let app: INestApplication;
  let transactionQueue: Queue;
  let processor: TransactionProcessor;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    transactionQueue = moduleFixture.get<Queue>(
      getQueueToken(TRANSACTION_QUEUE_NAME),
    );
    processor = moduleFixture.get<TransactionProcessor>(TransactionProcessor);
  });

  beforeEach(async () => {
    await clearQueue(transactionQueue);
  });

  afterAll(async () => {
    await clearQueue(transactionQueue);
    await dbPool.query(
      'DELETE FROM transactions WHERE transaction_id LIKE $1',
      ['idempotency-test-%'],
    );
    await app.close();
  });

  describe('Idempotency - Same TransactionId', () => {
    it('should prevent duplicate transactions when same transactionId is sent twice', async () => {
      const transactionId = `idempotency-test-${Date.now()}`;
      const createDto = {
        transactionId,
        amount: 250.0,
        currency: 'USD',
        type: TransactionType.CREDIT,
      };

      // First request
      await request(app.getHttpServer())
        .post('/transactions')
        .send(createDto)
        .expect(201);

      // Process first transaction
      await processAllWaitingJobs(transactionQueue, (job) =>
        processor.handleTransaction(job),
      );
      await waitForJobsToComplete(transactionQueue, 1000);

      // Second request with same transactionId
      await request(app.getHttpServer())
        .post('/transactions')
        .send(createDto)
        .expect(201);

      // Process second job (should detect duplicate)
      await processAllWaitingJobs(transactionQueue, (job) =>
        processor.handleTransaction(job),
      );
      await waitForJobsToComplete(transactionQueue, 1000);

      // Verify only one transaction exists
      const dbResult = await dbPool.query(
        'SELECT COUNT(*) as count FROM transactions WHERE transaction_id = $1',
        [transactionId],
      );
      expect(parseInt(dbResult.rows[0].count)).toBe(1);
    });
  });

  describe('Idempotency - Concurrent Requests', () => {
    it('should handle multiple simultaneous requests with same transactionId', async () => {
      const transactionId = `idempotency-concurrent-${Date.now()}`;
      const createDto = {
        transactionId,
        amount: 500.0,
        currency: 'EUR',
        type: TransactionType.DEBIT,
      };

      // Send 5 concurrent requests
      const promises = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/transactions')
            .send(createDto)
            .catch((err) => ({ error: err, status: 0 })),
        );

      const responses = await Promise.allSettled(promises);

      const fulfilledResponses = responses
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<any>).value)
        .filter((r) => !r.error && r.status === 201);

      expect(fulfilledResponses.length).toBeGreaterThan(0);

      // Process all queued jobs - multiple passes to ensure completion
      for (let i = 0; i < 3; i++) {
        await processAllWaitingJobs(transactionQueue, (job) =>
          processor.handleTransaction(job),
        );
        await waitForJobsToComplete(transactionQueue, 500);

        // Check if transaction was created
        const checkResult = await dbPool.query(
          'SELECT COUNT(*) as count FROM transactions WHERE transaction_id = $1',
          [transactionId],
        );
        if (parseInt(checkResult.rows[0].count) > 0) {
          break; // Transaction created, we're done
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Verify only one transaction exists
      const dbResult = await dbPool.query(
        'SELECT COUNT(*) as count FROM transactions WHERE transaction_id = $1',
        [transactionId],
      );
      expect(parseInt(dbResult.rows[0].count)).toBe(1);
    });
  });
});
