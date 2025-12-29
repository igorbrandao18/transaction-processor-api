"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const transactions_controller_1 = require("../../src/controllers/transactions.controller");
const transactions_service_1 = require("../../src/services/transactions.service");
const transactions_repository_1 = require("../../src/repositories/transactions.repository");
const transactions_queue_1 = require("../../src/queues/transactions.queue");
const prisma_service_1 = require("../../src/config/prisma.service");
const app_config_1 = require("../../src/config/app.config");
const transaction_entity_1 = require("../../src/entities/transaction.entity");
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });
describe('Transactions Integration - Full Flow', () => {
    let app;
    let prisma;
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
        const moduleFixture = await testing_1.Test.createTestingModule({
            controllers: [transactions_controller_1.TransactionsController],
            providers: [
                transactions_service_1.TransactionsService,
                transactions_repository_1.TransactionsRepository,
                prisma_service_1.PrismaService,
                {
                    provide: transactions_queue_1.TransactionsQueue,
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
        (0, app_config_1.configureApp)(app);
        await app.init();
        prisma = app.get(prisma_service_1.PrismaService);
    });
    afterAll(async () => {
        if (prisma) {
            await prisma.transaction.deleteMany().catch(() => { });
            await prisma.$disconnect().catch(() => { });
        }
        if (app) {
            await app.close();
        }
    });
    beforeEach(async () => {
        await prisma.transaction.deleteMany();
    });
    it('should get transaction metadata', async () => {
        const response = await (0, supertest_1.default)(app.getHttpServer())
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
                type: transaction_entity_1.TransactionType.CREDIT,
                status: transaction_entity_1.TransactionStatus.PENDING,
            },
        });
        await prisma.transaction.create({
            data: {
                transactionId: 'txn-2',
                amount: 200,
                currency: 'USD',
                type: transaction_entity_1.TransactionType.DEBIT,
                status: transaction_entity_1.TransactionStatus.COMPLETED,
            },
        });
        const response = await (0, supertest_1.default)(app.getHttpServer())
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
                type: transaction_entity_1.TransactionType.CREDIT,
                status: transaction_entity_1.TransactionStatus.PENDING,
            },
        });
        const response = await (0, supertest_1.default)(app.getHttpServer())
            .get(`/api/transactions/${created.id}`)
            .expect(200);
        expect(response.body.id).toBe(created.id);
        expect(response.body.transactionId).toBe('txn-get-by-id');
        expect(response.body.amount).toBe(150.75);
    });
});
//# sourceMappingURL=transactions.integration.spec.js.map