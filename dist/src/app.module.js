"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const bull_1 = require("@nestjs/bull");
const core_1 = require("@nestjs/core");
const _app_controller_1 = require("./app.controller");
const _app_service_1 = require("./app.service");
const transactions_controller_1 = require("./controllers/transactions.controller");
const health_controller_1 = require("./controllers/health.controller");
const metrics_controller_1 = require("./controllers/metrics.controller");
const transactions_service_1 = require("./services/transactions.service");
const transactions_repository_1 = require("./repositories/transactions.repository");
const logger_middleware_1 = require("./middleware/logger.middleware");
const bullmq_config_1 = require("./config/bullmq.config");
const transactions_queue_1 = require("./queues/transactions.queue");
const transaction_processor_1 = require("./processors/transaction.processor");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(logger_middleware_1.LoggerMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            bull_1.BullModule.forRoot(bullmq_config_1.bullmqConfig),
            bull_1.BullModule.registerQueue({
                name: bullmq_config_1.TRANSACTION_QUEUE_NAME,
            }),
        ],
        controllers: [
            _app_controller_1.AppController,
            transactions_controller_1.TransactionsController,
            health_controller_1.HealthController,
            metrics_controller_1.MetricsController,
        ],
        providers: [
            _app_service_1.AppService,
            transactions_service_1.TransactionsService,
            transactions_repository_1.TransactionsRepository,
            transactions_queue_1.TransactionsQueue,
            transaction_processor_1.TransactionProcessor,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map