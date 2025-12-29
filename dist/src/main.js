"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const _app_module_1 = require("./app.module");
const app_config_1 = require("./config/app.config");
const logger_config_1 = require("./config/logger.config");
const migrations_config_1 = require("./config/migrations.config");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function bootstrap() {
    try {
        logger_config_1.logger.info('Running database migrations...');
        (0, migrations_config_1.runMigrations)();
        logger_config_1.logger.info('Database migrations completed');
    }
    catch (error) {
        logger_config_1.logger.error('Failed to run migrations:', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        process.exit(1);
    }
    const app = await core_1.NestFactory.create(_app_module_1.AppModule);
    (0, app_config_1.configureApp)(app);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    const portNumber = typeof port === 'string' ? parseInt(port, 10) : port;
    logger_config_1.logger.info(`Application is running on: http://localhost:${portNumber}`);
    logger_config_1.logger.info(`Swagger documentation available at: http://localhost:${portNumber}/api/docs`);
}
void bootstrap();
//# sourceMappingURL=main.js.map