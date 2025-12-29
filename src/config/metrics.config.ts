import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

register.setDefaultLabels({
  app: 'transaction-processor-api',
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const httpRequestErrors = new Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const transactionsCreated = new Counter({
  name: 'transactions_created_total',
  help: 'Total number of transactions created',
  labelNames: ['type', 'status', 'currency'],
  registers: [register],
});

export const transactionsProcessed = new Counter({
  name: 'transactions_processed_total',
  help: 'Total number of transactions processed',
  labelNames: ['status'],
  registers: [register],
});

export const transactionsQueueSize = new Gauge({
  name: 'transactions_queue_size',
  help: 'Current size of transactions queue',
  labelNames: ['state'],
  registers: [register],
});

export const databaseConnections = new Gauge({
  name: 'database_connections',
  help: 'Current number of database connections',
  labelNames: ['state'],
  registers: [register],
});

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register],
});

export const redisConnections = new Gauge({
  name: 'redis_connections',
  help: 'Current number of Redis connections',
  registers: [register],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestErrors);
register.registerMetric(transactionsCreated);
register.registerMetric(transactionsProcessed);
register.registerMetric(transactionsQueueSize);
register.registerMetric(databaseConnections);
register.registerMetric(databaseQueryDuration);
register.registerMetric(redisConnections);
