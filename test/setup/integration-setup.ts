import * as dotenv from 'dotenv';

// Load test environment variables BEFORE importing database config
dotenv.config({ path: '.env.test', override: true });

import { dbPool } from '@config/database.config';

// Setup test database before all tests
beforeAll(async () => {
  try {
    // Test database connection
    const client = await dbPool.connect();
    await client.query('SELECT 1');
    client.release();
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  await dbPool.end();
});
