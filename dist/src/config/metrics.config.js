"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnections = exports.databaseQueryDuration = exports.databaseConnections = exports.transactionsQueueSize = exports.transactionsProcessed = exports.transactionsCreated = exports.httpRequestErrors = exports.httpRequestTotal = exports.httpRequestDuration = exports.register = void 0;
const prom_client_1 = require("prom-client");
exports.register = new prom_client_1.Registry();
exports.register.setDefaultLabels({
    app: 'transaction-processor-api',
});
exports.httpRequestDuration = new prom_client_1.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5],
    registers: [exports.register],
});
exports.httpRequestTotal = new prom_client_1.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
    registers: [exports.register],
});
exports.httpRequestErrors = new prom_client_1.Counter({
    name: 'http_request_errors_total',
    help: 'Total number of HTTP request errors',
    labelNames: ['method', 'route', 'status'],
    registers: [exports.register],
});
exports.transactionsCreated = new prom_client_1.Counter({
    name: 'transactions_created_total',
    help: 'Total number of transactions created',
    labelNames: ['type', 'status', 'currency'],
    registers: [exports.register],
});
exports.transactionsProcessed = new prom_client_1.Counter({
    name: 'transactions_processed_total',
    help: 'Total number of transactions processed',
    labelNames: ['status'],
    registers: [exports.register],
});
exports.transactionsQueueSize = new prom_client_1.Gauge({
    name: 'transactions_queue_size',
    help: 'Current size of transactions queue',
    labelNames: ['state'],
    registers: [exports.register],
});
exports.databaseConnections = new prom_client_1.Gauge({
    name: 'database_connections',
    help: 'Current number of database connections',
    labelNames: ['state'],
    registers: [exports.register],
});
exports.databaseQueryDuration = new prom_client_1.Histogram({
    name: 'database_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
    registers: [exports.register],
});
exports.redisConnections = new prom_client_1.Gauge({
    name: 'redis_connections',
    help: 'Current number of Redis connections',
    registers: [exports.register],
});
exports.register.registerMetric(exports.httpRequestDuration);
exports.register.registerMetric(exports.httpRequestTotal);
exports.register.registerMetric(exports.httpRequestErrors);
exports.register.registerMetric(exports.transactionsCreated);
exports.register.registerMetric(exports.transactionsProcessed);
exports.register.registerMetric(exports.transactionsQueueSize);
exports.register.registerMetric(exports.databaseConnections);
exports.register.registerMetric(exports.databaseQueryDuration);
exports.register.registerMetric(exports.redisConnections);
//# sourceMappingURL=metrics.config.js.map