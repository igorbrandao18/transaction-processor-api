"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockTransaction = exports.mockTransactionResponse = exports.mockTransaction = void 0;
const transaction_entity_1 = require("../../src/entities/transaction.entity");
exports.mockTransaction = {
    transactionId: 'test-transaction-id-123',
    amount: 100.5,
    currency: 'BRL',
    type: transaction_entity_1.TransactionType.CREDIT,
    status: transaction_entity_1.TransactionStatus.PENDING,
    metadata: {
        source: 'test',
        reference: 'test-order-123',
    },
};
exports.mockTransactionResponse = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    transactionId: 'test-transaction-id-123',
    amount: 100.5,
    currency: 'BRL',
    type: transaction_entity_1.TransactionType.CREDIT,
    status: transaction_entity_1.TransactionStatus.PENDING,
    metadata: {
        source: 'test',
        reference: 'test-order-123',
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
};
const createMockTransaction = (overrides) => ({
    ...exports.mockTransactionResponse,
    ...overrides,
});
exports.createMockTransaction = createMockTransaction;
//# sourceMappingURL=transactions.fixture.js.map