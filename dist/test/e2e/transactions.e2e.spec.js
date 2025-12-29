"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const _app_module_1 = require("../../src/app.module");
const prisma_service_1 = require("../../src/config/prisma.service");
const transaction_entity_1 = require("../../src/entities/transaction.entity");
describe('Transactions E2E', () => {
    let app;
    let prisma;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [_app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        prisma = moduleFixture.get(prisma_service_1.PrismaService);
        await app.init();
    });
    afterAll(async () => {
        await prisma.transaction.deleteMany({});
        await prisma.$disconnect();
        await app.close();
    });
    beforeEach(async () => {
        await prisma.transaction.deleteMany({});
    });
    describe('Full transaction flow', () => {
        it('should create, list, and retrieve a transaction', async () => {
            const createDto = {
                transactionId: 'txn-e2e-flow-1',
                amount: 250.75,
                currency: 'USD',
                type: transaction_entity_1.TransactionType.DEBIT,
                status: transaction_entity_1.TransactionStatus.PENDING,
            };
            const createResponse = await (0, supertest_1.default)(app.getHttpServer())
                .post('/api/transactions')
                .send(createDto)
                .expect(202);
            expect(createResponse.body.transactionId).toBe('txn-e2e-flow-1');
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const listResponse = await (0, supertest_1.default)(app.getHttpServer())
                .get('/api/transactions')
                .expect(200);
            const transaction = listResponse.body.data.find((t) => t.transactionId === 'txn-e2e-flow-1');
            expect(transaction).toBeDefined();
            if (transaction) {
                const getResponse = await (0, supertest_1.default)(app.getHttpServer())
                    .get(`/api/transactions/${transaction.id}`)
                    .expect(200);
                expect(getResponse.body.transactionId).toBe('txn-e2e-flow-1');
                expect(getResponse.body.amount).toBe(250.75);
                expect(getResponse.body.currency).toBe('USD');
            }
        });
    });
    describe('Idempotency', () => {
        it('should handle duplicate transactionId', async () => {
            const createDto = {
                transactionId: 'txn-idempotency-test',
                amount: 100,
                currency: 'BRL',
                type: transaction_entity_1.TransactionType.CREDIT,
                status: transaction_entity_1.TransactionStatus.PENDING,
            };
            await (0, supertest_1.default)(app.getHttpServer())
                .post('/api/transactions')
                .send(createDto)
                .expect(202);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await (0, supertest_1.default)(app.getHttpServer())
                .post('/api/transactions')
                .send(createDto)
                .expect(202);
            const listResponse = await (0, supertest_1.default)(app.getHttpServer())
                .get('/api/transactions?transactionId=txn-idempotency-test')
                .expect(200);
            const transactions = listResponse.body.data.filter((t) => t.transactionId === 'txn-idempotency-test');
            expect(transactions.length).toBeGreaterThanOrEqual(1);
        });
    });
});
//# sourceMappingURL=transactions.e2e.spec.js.map