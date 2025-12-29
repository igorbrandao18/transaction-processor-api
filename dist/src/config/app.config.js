"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureApp = configureApp;
const swagger_1 = require("@nestjs/swagger");
const http_exception_filter_1 = require("../filters/http-exception.filter");
const validation_config_1 = require("./validation.config");
const swagger_config_1 = require("./swagger.config");
const database_config_1 = require("./database.config");
const logger_config_1 = require("./logger.config");
async function configureApp(app) {
    app.useGlobalPipes(validation_config_1.validationPipeConfig);
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.enableCors();
    const document = swagger_1.SwaggerModule.createDocument(app, swagger_config_1.swaggerConfig, swagger_config_1.swaggerDocumentOptions);
    swagger_1.SwaggerModule.setup('api/docs', app, document, swagger_config_1.swaggerSetupOptions);
    try {
        await (0, database_config_1.testConnection)();
        logger_config_1.logger.info('Database connection established');
    }
    catch (error) {
        logger_config_1.logger.error('Failed to connect to database', { error });
        process.exit(1);
    }
}
//# sourceMappingURL=app.config.js.map