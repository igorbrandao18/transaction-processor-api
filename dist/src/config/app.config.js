"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureApp = configureApp;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const swagger_config_1 = require("./swagger.config");
function configureApp(app) {
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const document = swagger_1.SwaggerModule.createDocument(app, swagger_config_1.swaggerConfig, swagger_config_1.swaggerDocumentOptions);
    swagger_1.SwaggerModule.setup('api/docs', app, document, swagger_config_1.swaggerSetupOptions);
}
//# sourceMappingURL=app.config.js.map