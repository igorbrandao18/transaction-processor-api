import * as fs from 'fs';
import * as path from 'path';
import { dbPool } from '../src/config/database.config';
import dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  const client = await dbPool.connect();

  try {
    const migrationsDir = path.join(__dirname);
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
      console.log(`✓ Migration ${file} completed`);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await dbPool.end();
  }
}

runMigrations()
  .then(() => {
    console.log('Migrations finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migrations failed:', error);
    process.exit(1);
  });

