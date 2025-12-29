"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const transactions_service_1 = require("../../src/services/transactions.service");
const transactions_repository_1 = require("../../src/repositories/transactions.repository");
const transaction_entity_1 = require("../../src/entities/transaction.entity");
describe('TransactionsService', () => {
    let service;
    let repository;
    const mockTransaction = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        transactionId: 'txn-123',
        amount: 100.5,
        currency: 'BRL',
        type: transaction_entity_1.TransactionType.CREDIT,
        status: transaction_entity_1.TransactionStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                transactions_service_1.TransactionsService,
                {
                    provide: transactions_repository_1.TransactionsRepository,
                    useValue: {
                        create: jest.fn(),
                        findById: jest.fn(),
                        findAll: jest.fn(),
                        findByTransactionId: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(transactions_service_1.TransactionsService);
        repository = module.get(transactions_repository_1.TransactionsRepository);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('should create a transaction', async () => {
        const createDto = {
            transactionId: 'txn-123',
            amount: 100.5,
            currency: 'BRL',
            type: transaction_entity_1.TransactionType.CREDIT,
        };
        jest.spyOn(repository, 'findByTransactionId').mockResolvedValue(null);
        jest.spyOn(repository, 'create').mockResolvedValue(mockTransaction);
        const result = await service.create(createDto);
        expect(repository.create).toHaveBeenCalled();
        expect(result).toEqual(mockTransaction);
    });
    it('should find transaction by id', async () => {
        jest.spyOn(repository, 'findById').mockResolvedValue(mockTransaction);
        const result = await service.findById(mockTransaction.id);
        expect(repository.findById).toHaveBeenCalledWith(mockTransaction.id);
        expect(result).toEqual(mockTransaction);
    });
});
//# sourceMappingURL=transactions.service.spec.js.map