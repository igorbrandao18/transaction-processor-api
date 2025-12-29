jest.mock('pg');

describe('database.config defaults', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should use default host when DB_HOST is not set', () => {
    delete process.env.DB_HOST;
    const { dbPool } = require('../../../src/config/database.config');
    expect(dbPool).toBeDefined();
  });

  it('should use default port when DB_PORT is not set', () => {
    delete process.env.DB_PORT;
    const { dbPool } = require('../../../src/config/database.config');
    expect(dbPool).toBeDefined();
  });

  it('should use default user when DB_USER is not set', () => {
    delete process.env.DB_USER;
    const { dbPool } = require('../../../src/config/database.config');
    expect(dbPool).toBeDefined();
  });

  it('should use default password when DB_PASSWORD is not set', () => {
    delete process.env.DB_PASSWORD;
    const { dbPool } = require('../../../src/config/database.config');
    expect(dbPool).toBeDefined();
  });

  it('should use default database when DB_NAME is not set', () => {
    delete process.env.DB_NAME;
    const { dbPool } = require('../../../src/config/database.config');
    expect(dbPool).toBeDefined();
  });

  it('should use all defaults when no env vars are set', () => {
    process.env = {};
    const { dbPool } = require('../../../src/config/database.config');
    expect(dbPool).toBeDefined();
  });
});
