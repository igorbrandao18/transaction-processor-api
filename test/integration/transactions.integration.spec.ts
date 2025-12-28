import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@app.module';
import { dbPool } from '@config/database.config';
import {
  TransactionType,
  TransactionStatus,
} from '@entities/transaction.entity';
import { getQueueToken } from '@nestjs/bull';
import type { Queue } from 'bull';
import { TRANSACTION_QUEUE_NAME } from '@config/bullmq.config';
import { TransactionProcessor } from '@processors/transaction.processor';
import {
  waitForJobsToComplete,
  processAllWaitingJobs,
  clearQueue,
} from '@test-helpers/bullmq-test.helper';

describe('Transactions Integration Tests', () => {
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
      ['test-%'],
    );
    await app.close();
  });

  describe('POST /transactions', () => {
    it('should queue a transaction successfully', async () => {
      const createTransactionDto = {
        transactionId: `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        amount: 100.5,
        currency: 'BRL',
        type: TransactionType.CREDIT,
      };

      const response = await request(app.getHttpServer())
        .post('/transactions')
        .send(createTransactionDto)
        .expect(201);

      expect(response.body.status).toBe('queued');
      expect(response.body.transactionId).toBe(
        createTransactionDto.transactionId,
      );

      // Process job asynchronously
      await processAllWaitingJobs(transactionQueue, (job) =>
        processor.handleTransaction(job),
      );
      await waitForJobsToComplete(transactionQueue, 3000);

      // Verify transaction was created in database
      const dbResult = await dbPool.query(
        'SELECT * FROM transactions WHERE transaction_id = $1',
        [createTransactionDto.transactionId],
      );
      expect(dbResult.rows.length).toBe(1);
      expect(dbResult.rows[0].transaction_id).toBe(
        createTransactionDto.transactionId,
      );
    });

    it('should handle duplicate transactionId (idempotency)', async () => {
      const duplicateDto = {
        transactionId: `test-duplicate-${Date.now()}`,
        amount: 200.0,
        currency: 'USD',
        type: TransactionType.DEBIT,
      };

      // Create first transaction
      await request(app.getHttpServer())
        .post('/transactions')
        .send(duplicateDto)
        .expect(201);

      // Process first transaction
      await processAllWaitingJobs(transactionQueue, (job) =>
        processor.handleTransaction(job),
      );
      await waitForJobsToComplete(transactionQueue, 3000);

      // Try to create duplicate
      await request(app.getHttpServer())
        .post('/transactions')
        .send(duplicateDto)
        .expect(201);

      // Process second job (should detect duplicate) - multiple passes
      for (let i = 0; i < 3; i++) {
        await processAllWaitingJobs(transactionQueue, (job) =>
          processor.handleTransaction(job),
        );
        await waitForJobsToComplete(transactionQueue, 2000);

        // Check if transaction exists
        const checkResult = await dbPool.query(
          'SELECT COUNT(*) as count FROM transactions WHERE transaction_id = $1',
          [duplicateDto.transactionId],
        );
        if (parseInt(checkResult.rows[0].count) > 0) {
          break; // Transaction exists, we're done
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Verify only one transaction exists
      const dbResult = await dbPool.query(
        'SELECT COUNT(*) as count FROM transactions WHERE transaction_id = $1',
        [duplicateDto.transactionId],
      );
      expect(parseInt(dbResult.rows[0].count)).toBe(1);
    });

    it('should return 400 Bad Request for invalid data', () => {
      return request(app.getHttpServer())
        .post('/transactions')
        .send({
          transactionId: 'test-invalid',
          amount: -100,
          currency: 'INVALID',
          type: 'invalid-type',
        })
        .expect(400);
    });
  });

  describe('GET /transactions', () => {
    it('should return paginated list of transactions', async () => {
      // Create test transactions
      const transactions: Array<{
        transactionId: string;
        amount: number;
        currency: string;
        type: TransactionType;
      }> = [];
      for (let i = 0; i < 3; i++) {
        const dto = {
          transactionId: `test-list-${Date.now()}-${i}`,
          amount: 100 + i,
          currency: 'BRL',
          type: TransactionType.CREDIT,
        };
        await request(app.getHttpServer()).post('/transactions').send(dto);
        transactions.push(dto);
      }

      // Process all queued transactions
      await processAllWaitingJobs(transactionQueue, (job) =>
        processor.handleTransaction(job),
      );
      await waitForJobsToComplete(transactionQueue, 3000);

      const response = await request(app.getHttpServer())
        .get('/transactions?page=1&limit=10')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /transactions/:id', () => {
    it('should return a transaction by id', async () => {
      const createDto = {
        transactionId: `test-get-${Date.now()}`,
        amount: 200.5,
        currency: 'USD',
        type: TransactionType.DEBIT,
      };

      await request(app.getHttpServer())
        .post('/transactions')
        .send(createDto)
        .expect(201);

      // Process the transaction
      await processAllWaitingJobs(transactionQueue, (job) =>
        processor.handleTransaction(job),
      );
      await waitForJobsToComplete(transactionQueue, 3000);

      // Get transaction ID from database
      const dbResult = await dbPool.query(
        'SELECT id FROM transactions WHERE transaction_id = $1',
        [createDto.transactionId],
      );
      expect(dbResult.rows.length).toBe(1);
      const transactionId = dbResult.rows[0].id;

      // Get the transaction
      const response = await request(app.getHttpServer())
        .get(`/transactions/${transactionId}`)
        .expect(200);

      expect(response.body.id).toBe(transactionId);
      expect(response.body.transactionId).toBe(createDto.transactionId);
    });

    it('should return 404 for non-existent transaction', () => {
      return request(app.getHttpServer())
        .get('/transactions/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});
