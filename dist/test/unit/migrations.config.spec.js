"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const logger_config_1 = require("../../src/config/logger.config");
const migrations_config_1 = require("../../src/config/migrations.config");
jest.mock('child_process');
jest.mock('@config/logger.config', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    },
}));
describe('migrations.config', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('runMigrations', () => {
        it('should run Prisma migrations successfully', () => {
            child_process_1.execSync.mockReturnValue(undefined);
            (0, migrations_config_1.runMigrations)();
            expect(child_process_1.execSync).toHaveBeenCalledWith('npx prisma migrate deploy', {
                stdio: 'inherit',
                env: process.env,
            });
            expect(logger_config_1.logger.info).toHaveBeenCalledWith('Running Prisma migrations...');
            expect(logger_config_1.logger.info).toHaveBeenCalledWith('Prisma migrations completed successfully');
        });
        it('should throw error when migration fails', () => {
            const error = new Error('Migration failed');
            child_process_1.execSync.mockImplementation(() => {
                throw error;
            });
            expect(() => (0, migrations_config_1.runMigrations)()).toThrow('Migration failed');
            expect(logger_config_1.logger.error).toHaveBeenCalledWith('Migration failed:', {
                error: 'Migration failed',
            });
        });
        it('should handle unknown errors', () => {
            const error = new Error('Unknown error');
            child_process_1.execSync.mockImplementation(() => {
                throw error;
            });
            expect(() => (0, migrations_config_1.runMigrations)()).toThrow('Unknown error');
            expect(logger_config_1.logger.error).toHaveBeenCalledWith('Migration failed:', {
                error: 'Unknown error',
            });
        });
    });
});
//# sourceMappingURL=migrations.config.spec.js.map