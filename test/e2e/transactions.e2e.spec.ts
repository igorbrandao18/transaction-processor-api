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

describe('Transactions E2E Tests', () => {
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
      ['e2e-%'],
    );
    await app.close();
  });

  describe('Complete Transaction Flow', () => {
    it('should complete full transaction lifecycle', async () => {
      const transactionId = `e2e-flow-${Date.now()}`;
      const createDto = {
        transactionId,
        amount: 500.75,
        currency: 'EUR',
        type: TransactionType.CREDIT,
        metadata: {
          source: 'e2e-test',
          orderId: 'order-12345',
        },
      };

      // Step 1: Create transaction (queued)
      const createResponse = await request(app.getHttpServer())
        .post('/transactions')
        .send(createDto)
        .expect(201);

      expect(createResponse.body.transactionId).toBe(transactionId);
      expect(createResponse.body.status).toBe('queued');

      // Process the transaction asynchronously
      await processAllWaitingJobs(transactionQueue, (job) =>
        processor.handleTransaction(job),
      );
      await waitForJobsToComplete(transactionQueue, 500);

      // Get transaction ID from database
      const dbResult = await dbPool.query(
        'SELECT id FROM transactions WHERE transaction_id = $1',
        [transactionId],
      );
      expect(dbResult.rows.length).toBe(1);
      const createdId = dbResult.rows[0].id;

      // Step 2: Retrieve the transaction
      const getResponse = await request(app.getHttpServer())
        .get(`/transactions/${createdId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(createdId);
      expect(getResponse.body.transactionId).toBe(transactionId);

      // Step 3: List transactions and verify it appears
      const listResponse = await request(app.getHttpServer())
        .get('/transactions')
        .expect(200);

      const foundTransaction = listResponse.body.data.find(
        (t: any) => t.id === createdId,
      );
      expect(foundTransaction).toBeDefined();
      expect(foundTransaction.transactionId).toBe(transactionId);
    });
  });

  describe('Idempotency E2E', () => {
    it('should handle concurrent duplicate requests', async () => {
      const transactionId = `e2e-idempotency-${Date.now()}`;
      const createDto = {
        transactionId,
        amount: 1000.0,
        currency: 'BRL',
        type: TransactionType.CREDIT,
      };

      // Send multiple concurrent requests
      const promises = Array(3)
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

      // Process all jobs asynchronously
      await processAllWaitingJobs(transactionQueue, (job) =>
        processor.handleTransaction(job),
      );
      await waitForJobsToComplete(transactionQueue, 500);

      // Verify only one transaction exists
      const dbResult = await dbPool.query(
        'SELECT COUNT(*) as count FROM transactions WHERE transaction_id = $1',
        [transactionId],
      );
      expect(parseInt(dbResult.rows[0].count)).toBe(1);
    });
  });

  describe('Error Handling E2E', () => {
    it('should handle validation errors gracefully', async () => {
      const invalidDto = {
        transactionId: 'test',
        amount: -100,
        currency: 'XXX',
        type: 'invalid',
      };

      await request(app.getHttpServer())
        .post('/transactions')
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.message).toBeDefined();
        });
    });

    it('should handle not found errors', async () => {
      await request(app.getHttpServer())
        .get('/transactions/00000000-0000-0000-0000-000000000000')
        .expect(404)
        .expect((res) => {
          expect(res.body.statusCode).toBe(404);
        });
    });
  });
});
