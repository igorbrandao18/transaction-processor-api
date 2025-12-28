import { Registry, Counter, Histogram, Gauge } from 'prom-client';

// Create a Registry to register metrics
export const register = new Registry();

// Add default metrics (CPU, memory, etc.)
register.setDefaultLabels({
  app: 'transaction-processor-api',
});

// HTTP Request Metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Database Metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const dbConnectionsActive = new Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

// Queue Metrics
export const queueJobsTotal = new Counter({
  name: 'queue_jobs_total',
  help: 'Total number of queue jobs',
  labelNames: ['queue', 'status'],
  registers: [register],
});

export const queueJobsActive = new Gauge({
  name: 'queue_jobs_active',
  help: 'Number of active queue jobs',
  labelNames: ['queue'],
  registers: [register],
});

export const queueJobDuration = new Histogram({
  name: 'queue_job_duration_seconds',
  help: 'Duration of queue job processing in seconds',
  labelNames: ['queue', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

// Application Metrics
export const appInfo = new Gauge({
  name: 'app_info',
  help: 'Application information',
  labelNames: ['version', 'environment'],
  registers: [register],
});

export const appUptime = new Gauge({
  name: 'app_uptime_seconds',
  help: 'Application uptime in seconds',
  registers: [register],
});

// Initialize app info
appInfo.set(
  {
    version: process.env.npm_package_version || '0.0.1',
    environment: process.env.NODE_ENV || 'development',
  },
  1,
);

// Update uptime every 10 seconds
setInterval(() => {
  appUptime.set(process.uptime());
}, 10000);
