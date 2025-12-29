"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const transactions_repository_1 = require("../../../src/repositories/transactions.repository");
const prisma_service_1 = require("../../../src/config/prisma.service");
const client_1 = require("@prisma/client");
const transaction_entity_1 = require("../../../src/entities/transaction.entity");
describe('TransactionsRepository', () => {
    let repository;
    let prismaService;
    const mockPrismaTransaction = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        transactionId: 'txn-2024-01-15-abc123',
        amount: new client_1.Prisma.Decimal(100.5),
        currency: 'BRL',
        type: 'credit',
        status: 'pending',
        metadata: { source: 'test' },
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
    };
    beforeEach(async () => {
        prismaService = {
            transaction: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                count: jest.fn(),
            },
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                transactions_repository_1.TransactionsRepository,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: prismaService,
                },
            ],
        }).compile();
        repository = module.get(transactions_repository_1.TransactionsRepository);
    });
    describe('create', () => {
        it('should create a transaction', async () => {
            prismaService.transaction.create.mockResolvedValue(mockPrismaTransaction);
            const result = await repository.create({
                transactionId: 'txn-2024-01-15-abc123',
                amount: 100.5,
                currency: 'BRL',
                type: 'credit',
                status: 'pending',
                metadata: { source: 'test' },
            });
            expect(prismaService.transaction.create).toHaveBeenCalledWith({
                data: {
                    transactionId: 'txn-2024-01-15-abc123',
                    amount: expect.any(client_1.Prisma.Decimal),
                    currency: 'BRL',
                    type: 'credit',
                    status: 'pending',
                    metadata: { source: 'test' },
                },
            });
            expect(result.id).toBe(mockPrismaTransaction.id);
            expect(result.amount).toBe(100.5);
        });
        it('should handle null metadata', async () => {
            const transactionWithoutMetadata = {
                ...mockPrismaTransaction,
                metadata: null,
            };
            prismaService.transaction.create.mockResolvedValue(transactionWithoutMetadata);
            const result = await repository.create({
                transactionId: 'txn-2024-01-15-abc123',
                amount: 100.5,
                currency: 'BRL',
                type: 'credit',
                status: 'pending',
            });
            expect(result.metadata).toBeNull();
        });
    });
    describe('findById', () => {
        it('should find a transaction by id', async () => {
            prismaService.transaction.findUnique.mockResolvedValue(mockPrismaTransaction);
            const result = await repository.findById('123e4567-e89b-12d3-a456-426614174000');
            expect(prismaService.transaction.findUnique).toHaveBeenCalledWith({
                where: { id: '123e4567-e89b-12d3-a456-426614174000' },
            });
            expect(result).not.toBeNull();
            expect(result?.id).toBe(mockPrismaTransaction.id);
        });
        it('should return null if transaction not found', async () => {
            prismaService.transaction.findUnique.mockResolvedValue(null);
            const result = await repository.findById('non-existent-id');
            expect(result).toBeNull();
        });
    });
    describe('findByTransactionId', () => {
        it('should find a transaction by transactionId', async () => {
            prismaService.transaction.findUnique.mockResolvedValue(mockPrismaTransaction);
            const result = await repository.findByTransactionId('txn-2024-01-15-abc123');
            expect(prismaService.transaction.findUnique).toHaveBeenCalledWith({
                where: { transactionId: 'txn-2024-01-15-abc123' },
            });
            expect(result).not.toBeNull();
            expect(result?.transactionId).toBe('txn-2024-01-15-abc123');
        });
        it('should return null if transaction not found', async () => {
            prismaService.transaction.findUnique.mockResolvedValue(null);
            const result = await repository.findByTransactionId('non-existent-id');
            expect(result).toBeNull();
        });
    });
    describe('findAll', () => {
        it('should return paginated transactions', async () => {
            const query = {
                page: 1,
                limit: 10,
            };
            prismaService.transaction.findMany.mockResolvedValue([
                mockPrismaTransaction,
            ]);
            prismaService.transaction.count.mockResolvedValue(1);
            const result = await repository.findAll(query);
            expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
                where: {},
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
            });
            expect(result.transactions).toHaveLength(1);
            expect(result.total).toBe(1);
        });
        it('should apply filters', async () => {
            const query = {
                page: 1,
                limit: 10,
                status: transaction_entity_1.TransactionStatus.PENDING,
                type: transaction_entity_1.TransactionType.CREDIT,
            };
            prismaService.transaction.findMany.mockResolvedValue([
                mockPrismaTransaction,
            ]);
            prismaService.transaction.count.mockResolvedValue(1);
            await repository.findAll(query);
            const callArgs = prismaService.transaction.findMany.mock.calls[0][0];
            expect(callArgs.where).toMatchObject({
                status: 'pending',
                type: 'credit',
            });
            expect(callArgs.skip).toBe(0);
            expect(callArgs.take).toBe(10);
            expect(callArgs.orderBy).toEqual({ createdAt: 'desc' });
        });
        it('should apply date filters', async () => {
            const query = {
                page: 1,
                limit: 10,
                startDate: '2024-01-01',
                endDate: '2024-01-31',
            };
            prismaService.transaction.findMany.mockResolvedValue([
                mockPrismaTransaction,
            ]);
            prismaService.transaction.count.mockResolvedValue(1);
            await repository.findAll(query);
            expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
                where: {
                    createdAt: {
                        gte: new Date('2024-01-01'),
                        lte: new Date('2024-01-31'),
                    },
                },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
            });
        });
    });
});
//# sourceMappingURL=transactions.repository.spec.js.map