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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const transactions_repository_1 = require("@repositories/transactions.repository");
const transaction_entity_1 = require("@entities/transaction.entity");
let TransactionsService = class TransactionsService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async create(dto) {
        const existing = await this.repository.findByTransactionId(dto.transactionId);
        if (existing) {
            throw new common_1.ConflictException({
                message: 'Transaction with this ID already exists',
                existingTransaction: existing,
            });
        }
        const transaction = await this.repository.create({
            transactionId: dto.transactionId,
            amount: dto.amount,
            currency: dto.currency,
            type: dto.type,
            status: dto.status || transaction_entity_1.TransactionStatus.PENDING,
            metadata: dto.metadata,
        });
        return transaction;
    }
    async findById(id) {
        const transaction = await this.repository.findById(id);
        if (!transaction) {
            throw new common_1.NotFoundException(`Transaction with ID ${id} not found`);
        }
        return transaction;
    }
    async findAll(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const { transactions, total } = await this.repository.findAll(query);
        return {
            data: transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    getMetadata() {
        return {
            types: ['credit', 'debit'],
            statuses: ['pending', 'completed', 'failed'],
            currencies: ['BRL', 'USD', 'EUR', 'GBP', 'JPY'],
        };
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof transactions_repository_1.TransactionsRepository !== "undefined" && transactions_repository_1.TransactionsRepository) === "function" ? _a : Object])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map