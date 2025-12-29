"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appUptime = exports.appInfo = exports.queueJobDuration = exports.queueJobsActive = exports.queueJobsTotal = exports.dbConnectionsActive = exports.dbQueryDuration = exports.httpRequestTotal = exports.httpRequestDuration = exports.register = void 0;
const prom_client_1 = require("prom-client");
exports.register = new prom_client_1.Registry();
exports.register.setDefaultLabels({
    app: 'transaction-processor-api',
});
exports.httpRequestDuration = new prom_client_1.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    registers: [exports.register],
});
exports.httpRequestTotal = new prom_client_1.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [exports.register],
});
exports.dbQueryDuration = new prom_client_1.Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation', 'table'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [exports.register],
});
exports.dbConnectionsActive = new prom_client_1.Gauge({
    name: 'db_connections_active',
    help: 'Number of active database connections',
    registers: [exports.register],
});
exports.queueJobsTotal = new prom_client_1.Counter({
    name: 'queue_jobs_total',
    help: 'Total number of queue jobs',
    labelNames: ['queue', 'status'],
    registers: [exports.register],
});
exports.queueJobsActive = new prom_client_1.Gauge({
    name: 'queue_jobs_active',
    help: 'Number of active queue jobs',
    labelNames: ['queue'],
    registers: [exports.register],
});
exports.queueJobDuration = new prom_client_1.Histogram({
    name: 'queue_job_duration_seconds',
    help: 'Duration of queue job processing in seconds',
    labelNames: ['queue', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    registers: [exports.register],
});
exports.appInfo = new prom_client_1.Gauge({
    name: 'app_info',
    help: 'Application information',
    labelNames: ['version', 'environment'],
    registers: [exports.register],
});
exports.appUptime = new prom_client_1.Gauge({
    name: 'app_uptime_seconds',
    help: 'Application uptime in seconds',
    registers: [exports.register],
});
exports.appInfo.set({
    version: process.env.npm_package_version || '0.0.1',
    environment: process.env.NODE_ENV || 'development',
}, 1);
setInterval(() => {
    exports.appUptime.set(process.uptime());
}, 10000);
//# sourceMappingURL=metrics.config.js.map