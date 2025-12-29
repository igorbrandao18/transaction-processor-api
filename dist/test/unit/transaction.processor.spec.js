"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const transaction_processor_1 = require("../../src/processors/transaction.processor");
const transactions_service_1 = require("../../src/services/transactions.service");
const transaction_entity_1 = require("../../src/entities/transaction.entity");
describe('TransactionProcessor', () => {
    let processor;
    let transactionsService;
    const mockCreateDto = {
        transactionId: 'txn-2024-01-15-abc123',
        amount: 100.5,
        currency: 'BRL',
        type: transaction_entity_1.TransactionType.CREDIT,
        status: transaction_entity_1.TransactionStatus.PENDING,
    };
    const mockTransaction = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        transactionId: 'txn-2024-01-15-abc123',
        amount: 100.5,
        currency: 'BRL',
        type: transaction_entity_1.TransactionType.CREDIT,
        status: transaction_entity_1.TransactionStatus.PENDING,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
    };
    const mockJob = {
        id: 'txn-2024-01-15-abc123',
        data: mockCreateDto,
    };
    beforeEach(async () => {
        const mockTransactionsService = {
            create: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                transaction_processor_1.TransactionProcessor,
                {
                    provide: transactions_service_1.TransactionsService,
                    useValue: mockTransactionsService,
                },
            ],
        }).compile();
        processor = module.get(transaction_processor_1.TransactionProcessor);
        transactionsService =
            module.get(transactions_service_1.TransactionsService);
    });
    describe('handleTransaction', () => {
        it('should process transaction successfully', async () => {
            transactionsService.create.mockResolvedValue(mockTransaction);
            const result = await processor.handleTransaction(mockJob);
            expect(transactionsService.create).toHaveBeenCalledWith(mockCreateDto);
            expect(transactionsService.create).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockTransaction);
        });
        it('should throw error when transaction creation fails', async () => {
            const error = new Error('Database error');
            transactionsService.create.mockRejectedValue(error);
            await expect(processor.handleTransaction(mockJob)).rejects.toThrow('Database error');
            expect(transactionsService.create).toHaveBeenCalledWith(mockCreateDto);
        });
        it('should handle unknown errors', async () => {
            const unknownError = 'Unknown error';
            transactionsService.create.mockRejectedValue(unknownError);
            await expect(processor.handleTransaction(mockJob)).rejects.toBe(unknownError);
        });
    });
});
//# sourceMappingURL=transaction.processor.spec.js.map