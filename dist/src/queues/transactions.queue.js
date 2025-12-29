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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsQueue = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
let TransactionsQueue = class TransactionsQueue {
    queue;
    constructor(queue) {
        this.queue = queue;
    }
    async addTransactionJob(transactionData) {
        const job = await this.queue.add('process-transaction', transactionData, {
            jobId: transactionData.transactionId,
        });
        return {
            jobId: job.id?.toString() || '',
            transactionId: transactionData.transactionId,
        };
    }
    async getJobStatus(transactionId) {
        const jobs = await this.queue.getJobs([
            'waiting',
            'active',
            'completed',
            'failed',
        ]);
        const job = jobs.find((j) => j.id === transactionId);
        if (!job) {
            return null;
        }
        const state = await job.getState();
        const progress = job.progress();
        return {
            id: job.id,
            transactionId,
            state,
            progress,
            data: job.data,
            result: job.returnvalue,
            failedReason: job.failedReason,
            processedOn: job.processedOn,
            finishedOn: job.finishedOn,
        };
    }
    async getQueueStats() {
        const [waiting, active, completed, failed] = await Promise.all([
            this.queue.getWaitingCount(),
            this.queue.getActiveCount(),
            this.queue.getCompletedCount(),
            this.queue.getFailedCount(),
        ]);
        return {
            waiting,
            active,
            completed,
            failed,
            total: waiting + active + completed + failed,
        };
    }
};
exports.TransactionsQueue = TransactionsQueue;
exports.TransactionsQueue = TransactionsQueue = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('transactions')),
    __metadata("design:paramtypes", [Object])
], TransactionsQueue);
//# sourceMappingURL=transactions.queue.js.map