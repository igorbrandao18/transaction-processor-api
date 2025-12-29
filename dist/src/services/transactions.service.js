"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const transactions_repository_1 = require("../repositories/transactions.repository");
const transaction_entity_1 = require("../entities/transaction.entity");
const logger_config_1 = require("../config/logger.config");
const crypto_1 = require("crypto");
let TransactionsService = class TransactionsService {
    transactionsRepository;
    constructor(transactionsRepository) {
        this.transactionsRepository = transactionsRepository;
    }
    async create(createTransactionDto) {
        const transactionId = createTransactionDto.transactionId?.trim() || `txn-${(0, crypto_1.randomUUID)()}`;
        logger_config_1.logger.info('Creating transaction', {
            transactionId,
            provided: !!createTransactionDto.transactionId,
        });
        const existingTransaction = await this.transactionsRepository.findByTransactionId(transactionId);
        if (existingTransaction) {
            logger_config_1.logger.warn('Transaction already exists', {
                transactionId,
            });
            throw new common_1.ConflictException({
                error: 'Transaction already exists',
                transactionId,
                existingTransaction,
            });
        }
        const transaction = {
            transactionId,
            amount: createTransactionDto.amount,
            currency: createTransactionDto.currency,
            type: createTransactionDto.type,
            status: transaction_entity_1.TransactionStatus.PENDING,
            metadata: createTransactionDto.metadata,
        };
        try {
            const createdTransaction = await this.transactionsRepository.create(transaction);
            logger_config_1.logger.info('Transaction created successfully', {
                id: createdTransaction.id,
                transactionId: createdTransaction.transactionId,
            });
            return createdTransaction;
        }
        catch (error) {
            if (error.code === '23505' || error.message?.includes('duplicate')) {
                const existing = await this.transactionsRepository.findByTransactionId(transactionId);
                if (existing) {
                    logger_config_1.logger.warn('Transaction already exists (race condition)', {
                        transactionId,
                    });
                    return existing;
                }
            }
            logger_config_1.logger.error('Error creating transaction', { error: error.message });
            throw error;
        }
    }
    async findOne(id) {
        logger_config_1.logger.info('Finding transaction', { id });
        const transaction = await this.transactionsRepository.findById(id);
        if (!transaction) {
            logger_config_1.logger.warn('Transaction not found', { id });
            throw new common_1.NotFoundException(`Transaction with ID ${id} not found`);
        }
        return transaction;
    }
    async findAll(queryDto) {
        logger_config_1.logger.info('Finding transactions', { query: queryDto });
        const page = queryDto.page || 1;
        const limit = queryDto.limit || 20;
        const result = await this.transactionsRepository.findAll({
            page,
            limit,
            status: queryDto.status,
            type: queryDto.type,
            startDate: queryDto.startDate,
            endDate: queryDto.endDate,
        });
        const totalPages = Math.ceil(result.total / limit);
        return {
            data: result.transactions,
            pagination: {
                page,
                limit,
                total: result.total,
                totalPages,
            },
        };
    }
    async updateStatus(id, status) {
        logger_config_1.logger.info('Updating transaction status', { id, status });
        return this.transactionsRepository.updateStatus(id, status);
    }
    async findByTransactionId(transactionId) {
        return this.transactionsRepository.findByTransactionId(transactionId);
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [transactions_repository_1.TransactionsRepository])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map