"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const transactions_service_1 = require("../../../src/services/transactions.service");
const transactions_repository_1 = require("../../../src/repositories/transactions.repository");
const common_1 = require("@nestjs/common");
const transaction_entity_1 = require("../../../src/entities/transaction.entity");
describe('TransactionsService', () => {
    let service;
    let repository;
    const mockTransaction = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        transactionId: 'txn-2024-01-15-abc123',
        amount: 100.5,
        currency: 'BRL',
        type: 'credit',
        status: 'pending',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
    };
    const mockCreateDto = {
        transactionId: 'txn-2024-01-15-abc123',
        amount: 100.5,
        currency: 'BRL',
        type: transaction_entity_1.TransactionType.CREDIT,
        status: transaction_entity_1.TransactionStatus.PENDING,
    };
    beforeEach(async () => {
        const mockRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findByTransactionId: jest.fn(),
            findAll: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                transactions_service_1.TransactionsService,
                {
                    provide: transactions_repository_1.TransactionsRepository,
                    useValue: mockRepository,
                },
            ],
        }).compile();
        service = module.get(transactions_service_1.TransactionsService);
        repository = module.get(transactions_repository_1.TransactionsRepository);
    });
    describe('create', () => {
        it('should create a transaction successfully', async () => {
            repository.findByTransactionId.mockResolvedValue(null);
            repository.create.mockResolvedValue(mockTransaction);
            const result = await service.create(mockCreateDto);
            expect(repository.findByTransactionId).toHaveBeenCalledWith(mockCreateDto.transactionId);
            expect(repository.create).toHaveBeenCalledWith({
                transactionId: mockCreateDto.transactionId,
                amount: mockCreateDto.amount,
                currency: mockCreateDto.currency,
                type: mockCreateDto.type,
                status: mockCreateDto.status,
                metadata: mockCreateDto.metadata,
            });
            expect(result).toEqual(mockTransaction);
        });
        it('should throw ConflictException if transaction already exists', async () => {
            repository.findByTransactionId.mockResolvedValue(mockTransaction);
            await expect(service.create(mockCreateDto)).rejects.toThrow(common_1.ConflictException);
            expect(repository.create).not.toHaveBeenCalled();
        });
        it('should use default status if not provided', async () => {
            const dtoWithoutStatus = { ...mockCreateDto, status: undefined };
            repository.findByTransactionId.mockResolvedValue(null);
            repository.create.mockResolvedValue(mockTransaction);
            await service.create(dtoWithoutStatus);
            expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
                status: transaction_entity_1.TransactionStatus.PENDING,
            }));
        });
    });
    describe('findById', () => {
        it('should return a transaction by id', async () => {
            repository.findById.mockResolvedValue(mockTransaction);
            const result = await service.findById('123e4567-e89b-12d3-a456-426614174000');
            expect(repository.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
            expect(result).toEqual(mockTransaction);
        });
        it('should throw NotFoundException if transaction not found', async () => {
            repository.findById.mockResolvedValue(null);
            await expect(service.findById('non-existent-id')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('findAll', () => {
        it('should return paginated transactions', async () => {
            const query = { page: 1, limit: 10 };
            repository.findAll.mockResolvedValue({
                transactions: [mockTransaction],
                total: 1,
            });
            const result = await service.findAll(query);
            expect(repository.findAll).toHaveBeenCalledWith(query);
            expect(result.data).toEqual([mockTransaction]);
            expect(result.pagination).toEqual({
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
            });
        });
        it('should use default pagination values', async () => {
            const query = {};
            repository.findAll.mockResolvedValue({
                transactions: [mockTransaction],
                total: 1,
            });
            const result = await service.findAll(query);
            expect(result.pagination).toEqual({
                page: 1,
                limit: 20,
                total: 1,
                totalPages: 1,
            });
        });
        it('should calculate totalPages correctly', async () => {
            const query = { page: 1, limit: 10 };
            repository.findAll.mockResolvedValue({
                transactions: [],
                total: 25,
            });
            const result = await service.findAll(query);
            expect(result.pagination.totalPages).toBe(3);
        });
    });
    describe('getMetadata', () => {
        it('should return transaction metadata', () => {
            const result = service.getMetadata();
            expect(result).toEqual({
                types: ['credit', 'debit'],
                statuses: ['pending', 'completed', 'failed'],
                currencies: ['BRL', 'USD', 'EUR', 'GBP', 'JPY'],
            });
        });
    });
});
//# sourceMappingURL=transactions.service.spec.js.map