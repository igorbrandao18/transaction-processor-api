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
var TransactionProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const transactions_service_1 = require("../services/transactions.service");
const transaction_entity_1 = require("../entities/transaction.entity");
const metrics_config_1 = require("../config/metrics.config");
let TransactionProcessor = TransactionProcessor_1 = class TransactionProcessor {
    transactionsService;
    logger = new common_1.Logger(TransactionProcessor_1.name);
    constructor(transactionsService) {
        this.transactionsService = transactionsService;
    }
    async handleTransaction(job) {
        this.logger.log(`Processing transaction job: ${job.id}`, {
            transactionId: job.data.transactionId,
            jobId: job.id,
        });
        try {
            const transaction = await this.transactionsService.create(job.data);
            const completedTransaction = await this.transactionsService.updateStatus(transaction.id, transaction_entity_1.TransactionStatus.COMPLETED);
            metrics_config_1.transactionsProcessed.inc({ status: 'success' });
            this.logger.log(`Transaction processed successfully: ${job.id}`, {
                transactionId: completedTransaction.transactionId,
                transactionUuid: completedTransaction.id,
                jobId: job.id,
                status: completedTransaction.status,
            });
            return completedTransaction;
        }
        catch (error) {
            metrics_config_1.transactionsProcessed.inc({ status: 'error' });
            try {
                const existingTransaction = await this.transactionsService.findByTransactionId(job.data.transactionId);
                if (existingTransaction &&
                    existingTransaction.status === transaction_entity_1.TransactionStatus.PENDING) {
                    await this.transactionsService.updateStatus(existingTransaction.id, transaction_entity_1.TransactionStatus.FAILED);
                }
            }
            catch (updateError) {
                this.logger.warn(`Could not update transaction status to failed: ${job.id}`, {
                    transactionId: job.data.transactionId,
                    error: updateError instanceof Error
                        ? updateError.message
                        : 'Unknown error',
                });
            }
            this.logger.error(`Failed to process transaction: ${job.id}`, {
                transactionId: job.data.transactionId,
                jobId: job.id,
                error: error instanceof Error ? error.message : 'Unknown error',
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
exports.TransactionProcessor = TransactionProcessor = TransactionProcessor_1 = __decorate([
    (0, bull_1.Processor)('transactions'),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [transactions_service_1.TransactionsService])
], TransactionProcessor);
//# sourceMappingURL=transaction.processor.js.map