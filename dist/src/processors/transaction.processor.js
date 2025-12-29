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
exports.TransactionProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const transactions_service_1 = require("../services/transactions.service");
const bullmq_config_1 = require("../config/bullmq.config");
const transaction_entity_1 = require("../entities/transaction.entity");
const logger_config_1 = require("../config/logger.config");
let TransactionProcessor = class TransactionProcessor {
    transactionsService;
    constructor(transactionsService) {
        this.transactionsService = transactionsService;
    }
    async handleTransaction(job) {
        const { transactionId, amount, currency, type, metadata } = job.data;
        logger_config_1.logger.info('Processing transaction from queue', {
            jobId: job.id,
            transactionId: transactionId || 'auto-generated',
            attempt: job.attemptsMade + 1,
        });
        try {
            const transaction = await this.transactionsService.create({
                transactionId,
                amount,
                currency,
                type,
                metadata,
            });
            logger_config_1.logger.info('Transaction created with pending status, processing...', {
                transactionId: transaction.transactionId,
                id: transaction.id,
            });
            const processingDelay = parseInt(process.env.TRANSACTION_PROCESSING_DELAY_MS || '3000');
            await new Promise((resolve) => setTimeout(resolve, processingDelay));
            const completedTransaction = await this.transactionsService.updateStatus(transaction.id, transaction_entity_1.TransactionStatus.COMPLETED);
            logger_config_1.logger.info('Transaction processed successfully', {
                jobId: job.id,
                transactionId,
                transactionStatus: completedTransaction.status,
            });
            return completedTransaction;
        }
        catch (error) {
            if (error?.response?.error !== 'Transaction already exists' &&
                transactionId) {
                try {
                    const existingTransaction = await this.transactionsService.findByTransactionId(transactionId);
                    if (existingTransaction &&
                        existingTransaction.status === transaction_entity_1.TransactionStatus.PENDING) {
                        await this.transactionsService.updateStatus(existingTransaction.id, transaction_entity_1.TransactionStatus.FAILED);
                    }
                }
                catch (updateError) {
                    logger_config_1.logger.warn('Could not update transaction status to failed', {
                        transactionId: transactionId || 'unknown',
                        error: updateError.message,
                    });
                }
            }
            logger_config_1.logger.error('Failed to process transaction', {
                jobId: job.id,
                transactionId: transactionId || 'auto-generated',
                error: error.message,
                attempt: job.attemptsMade + 1,
            });
            throw error;
        }
    }
};
exports.TransactionProcessor = TransactionProcessor;
__decorate([
    (0, bull_1.Process)('process-transaction'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionProcessor.prototype, "handleTransaction", null);
exports.TransactionProcessor = TransactionProcessor = __decorate([
    (0, bull_1.Processor)(bullmq_config_1.TRANSACTION_QUEUE_NAME),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [transactions_service_1.TransactionsService])
], TransactionProcessor);
//# sourceMappingURL=transaction.processor.js.map