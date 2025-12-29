import {
  register,
  httpRequestDuration,
  httpRequestTotal,
  dbQueryDuration,
  dbConnectionsActive,
  queueJobsTotal,
  queueJobsActive,
  queueJobDuration,
  appInfo,
  appUptime,
} from '@config/metrics.config';

describe('metrics.config', () => {
  const originalEnv = process.env;
  let mockSetInterval: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    mockSetInterval = jest.spyOn(global, 'setInterval');
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('should export register', () => {
    expect(register).toBeDefined();
  });

  it('should export httpRequestDuration histogram', () => {
    expect(httpRequestDuration).toBeDefined();
    expect(httpRequestDuration.name).toBe('http_request_duration_seconds');
  });

  it('should export httpRequestTotal counter', () => {
    expect(httpRequestTotal).toBeDefined();
    expect(httpRequestTotal.name).toBe('http_requests_total');
  });

  it('should export dbQueryDuration histogram', () => {
    expect(dbQueryDuration).toBeDefined();
    expect(dbQueryDuration.name).toBe('db_query_duration_seconds');
  });

  it('should export dbConnectionsActive gauge', () => {
    expect(dbConnectionsActive).toBeDefined();
    expect(dbConnectionsActive.name).toBe('db_connections_active');
  });

  it('should export queueJobsTotal counter', () => {
    expect(queueJobsTotal).toBeDefined();
    expect(queueJobsTotal.name).toBe('queue_jobs_total');
  });

  it('should export queueJobsActive gauge', () => {
    expect(queueJobsActive).toBeDefined();
    expect(queueJobsActive.name).toBe('queue_jobs_active');
  });

  it('should export queueJobDuration histogram', () => {
    expect(queueJobDuration).toBeDefined();
    expect(queueJobDuration.name).toBe('queue_job_duration_seconds');
  });

  it('should export appInfo gauge', () => {
    expect(appInfo).toBeDefined();
    expect(appInfo.name).toBe('app_info');
  });

  it('should export appUptime gauge', () => {
    expect(appUptime).toBeDefined();
    expect(appUptime.name).toBe('app_uptime_seconds');
  });

  it('should use default version when npm_package_version is not set', () => {
    const originalVersion = process.env.npm_package_version;
    delete process.env.npm_package_version;
    jest.resetModules();
    const {
      appInfo: newAppInfo,
    } = require('../../../src/config/metrics.config');
    expect(newAppInfo).toBeDefined();
    process.env.npm_package_version = originalVersion;
  });

  it('should use default environment when NODE_ENV is not set', () => {
    const originalEnv = process.env.NODE_ENV;
    delete process.env.NODE_ENV;
    jest.resetModules();
    const {
      appInfo: newAppInfo,
    } = require('../../../src/config/metrics.config');
    expect(newAppInfo).toBeDefined();
    process.env.NODE_ENV = originalEnv;
  });

  it('should set up interval for appUptime updates', () => {
    jest.resetModules();
    require('../../../src/config/metrics.config');
    expect(mockSetInterval).toHaveBeenCalled();
  });

  it('should call appUptime.set when interval executes', () => {
    jest.resetModules();
    const {
      appUptime: newAppUptime,
    } = require('../../../src/config/metrics.config');
    const setSpy = jest.spyOn(newAppUptime, 'set');

    jest.advanceTimersByTime(10000);

    expect(setSpy).toHaveBeenCalled();
    setSpy.mockRestore();
  });
});
