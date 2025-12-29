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
exports.TransactionsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../config/prisma.service");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
let TransactionsRepository = class TransactionsRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(transaction) {
        const created = await this.prisma.transaction.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                transactionId: transaction.transactionId,
                amount: new client_1.Prisma.Decimal(transaction.amount),
                currency: transaction.currency,
                type: transaction.type,
                status: (transaction.status || 'pending'),
                metadata: transaction.metadata || undefined,
            },
        });
        return this.mapPrismaToEntity(created);
    }
    async findById(id) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
        });
        if (!transaction) {
            return null;
        }
        return this.mapPrismaToEntity(transaction);
    }
    async findByTransactionId(transactionId) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { transactionId },
        });
        if (!transaction) {
            return null;
        }
        return this.mapPrismaToEntity(transaction);
    }
    async findAll(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (query.status) {
            where.status = query.status;
        }
        if (query.type) {
            where.type = query.type;
        }
        if (query.startDate || query.endDate) {
            where.createdAt = {};
            if (query.startDate) {
                where.createdAt.gte = new Date(query.startDate);
            }
            if (query.endDate) {
                where.createdAt.lte = new Date(query.endDate);
            }
        }
        const [transactions, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.transaction.count({ where }),
        ]);
        return {
            transactions: transactions.map((t) => this.mapPrismaToEntity(t)),
            total,
        };
    }
    mapPrismaToEntity(transaction) {
        return {
            id: transaction.id,
            transactionId: transaction.transactionId,
            amount: transaction.amount.toNumber(),
            currency: transaction.currency,
            type: transaction.type,
            status: transaction.status,
            metadata: transaction.metadata,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
        };
    }
};
exports.TransactionsRepository = TransactionsRepository;
exports.TransactionsRepository = TransactionsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransactionsRepository);
//# sourceMappingURL=transactions.repository.js.map