import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { TransactionsController } from '@controllers/transactions.controller';
import { TransactionsService } from '@services/transactions.service';
import { TransactionsRepository } from '@repositories/transactions.repository';
import { TransactionsQueue } from '@queues/transactions.queue';
import { PrismaService } from '@config/prisma.service';
import { configureApp } from '@config/app.config';
import {
  TransactionType,
  TransactionStatus,
} from '@entities/transaction.entity';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

describe('Transactions Integration - Full Flow', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const mockQueue = {
      add: jest.fn().mockResolvedValue({
        id: 'mock-job-id',
        toString: () => 'mock-job-id',
      }),
      getJobs: jest.fn().mockResolvedValue([]),
      getWaitingCount: jest.fn().mockResolvedValue(0),
      getActiveCount: jest.fn().mockResolvedValue(0),
      getCompletedCount: jest.fn().mockResolvedValue(0),
      getFailedCount: jest.fn().mockResolvedValue(0),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        TransactionsService,
        TransactionsRepository,
        PrismaService,
        {
          provide: TransactionsQueue,
          useValue: {
            addTransactionJob: jest.fn().mockResolvedValue({
              jobId: 'mock-job-id',
              transactionId: 'mock-transaction-id',
            }),
            getJobStatus: jest.fn(),
            getQueueStats: jest.fn(),
          },
        },
        {
          provide: 'BullQueue_transactions',
          useValue: mockQueue,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.transaction.deleteMany().catch(() => {});
      await prisma.$disconnect().catch(() => {});
    }
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    await prisma.transaction.deleteMany();
  });

  it('should get transaction metadata', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/transactions/metadata')
      .expect(200);

    expect(response.body).toHaveProperty('types');
    expect(response.body).toHaveProperty('statuses');
    expect(response.body).toHaveProperty('currencies');
    expect(Array.isArray(response.body.types)).toBe(true);
    expect(Array.isArray(response.body.statuses)).toBe(true);
    expect(Array.isArray(response.body.currencies)).toBe(true);
  });

  it('should list transactions with pagination', async () => {
    await prisma.transaction.create({
      data: {
        transactionId: 'txn-1',
        amount: 100,
        currency: 'BRL',
        type: TransactionType.CREDIT,
        status: TransactionStatus.PENDING,
      },
    });

    await prisma.transaction.create({
      data: {
        transactionId: 'txn-2',
        amount: 200,
        currency: 'USD',
        type: TransactionType.DEBIT,
        status: TransactionStatus.COMPLETED,
      },
    });

    const response = await request(app.getHttpServer())
      .get('/api/transactions?page=1&limit=10')
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(10);
    expect(response.body.pagination.total).toBe(2);
  });

  it('should get transaction by id', async () => {
    const created = await prisma.transaction.create({
      data: {
        transactionId: 'txn-get-by-id',
        amount: 150.75,
        currency: 'EUR',
        type: TransactionType.CREDIT,
        status: TransactionStatus.PENDING,
      },
    });

    const response = await request(app.getHttpServer())
      .get(`/api/transactions/${created.id}`)
      .expect(200);

    expect(response.body.id).toBe(created.id);
    expect(response.body.transactionId).toBe('txn-get-by-id');
    expect(response.body.amount).toBe(150.75);
  });
});
