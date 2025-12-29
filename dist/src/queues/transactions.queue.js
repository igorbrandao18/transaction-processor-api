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
const bullmq_config_1 = require("../config/bullmq.config");
let TransactionsQueue = class TransactionsQueue {
    transactionQueue;
    constructor(transactionQueue) {
        this.transactionQueue = transactionQueue;
    }
    async addTransaction(dto) {
        const jobId = dto.transactionId ||
            `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await this.transactionQueue.add('process-transaction', dto, {
            jobId,
            attempts: parseInt(process.env.BULLMQ_DEFAULT_ATTEMPTS || '3'),
            backoff: {
                type: 'exponential',
                delay: parseInt(process.env.BULLMQ_BACKOFF_DELAY || '2000'),
            },
        });
    }
    async getJobStatus(transactionId) {
        const job = await this.transactionQueue.getJob(transactionId);
        if (!job) {
            return null;
        }
        const state = await job.getState();
        const progress = typeof job.progress === 'function' ? await job.progress() : job.progress;
        const result = job.returnvalue;
        const failedReason = job.failedReason;
        return {
            id: job.id,
            transactionId,
            state,
            progress,
            result,
            failedReason,
            processedOn: job.processedOn,
            finishedOn: job.finishedOn,
        };
    }
    async getQueueStats() {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            this.transactionQueue.getWaiting(),
            this.transactionQueue.getActive(),
            this.transactionQueue.getCompleted(),
            this.transactionQueue.getFailed(),
            this.transactionQueue.getDelayed(),
        ]);
        return {
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length,
            delayed: delayed.length,
            jobs: {
                waiting: waiting.map((job) => ({
                    id: job.id,
                    transactionId: job.data.transactionId,
                    createdAt: new Date(job.timestamp).toISOString(),
                })),
                active: active.map((job) => ({
                    id: job.id,
                    transactionId: job.data.transactionId,
                    createdAt: new Date(job.timestamp).toISOString(),
                })),
                delayed: delayed.map((job) => ({
                    id: job.id,
                    transactionId: job.data.transactionId,
                    createdAt: new Date(job.timestamp).toISOString(),
                    delay: job.delay || 0,
                })),
            },
        };
    }
};
exports.TransactionsQueue = TransactionsQueue;
exports.TransactionsQueue = TransactionsQueue = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)(bullmq_config_1.TRANSACTION_QUEUE_NAME)),
    __metadata("design:paramtypes", [Object])
], TransactionsQueue);
//# sourceMappingURL=transactions.queue.js.map