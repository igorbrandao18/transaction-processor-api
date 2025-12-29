"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const child_process_1 = require("child_process");
const logger_config_1 = require("./logger.config");
function runMigrations() {
    try {
        logger_config_1.logger.info('Running Prisma migrations...');
        (0, child_process_1.execSync)('npx prisma migrate deploy', {
            stdio: 'inherit',
            env: process.env,
        });
        logger_config_1.logger.info('Prisma migrations completed successfully');
    }
    catch (error) {
        logger_config_1.logger.error('Migration failed:', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
}
//# sourceMappingURL=migrations.config.js.map