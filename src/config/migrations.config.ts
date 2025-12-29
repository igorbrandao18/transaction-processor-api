import { execSync } from 'child_process';
import { logger } from '@config/logger.config';

export function runMigrations(): void {
  try {
    logger.info('Running Prisma migrations...');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: process.env,
    });
    logger.info('Prisma migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
