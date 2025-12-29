"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_1 = require("@nestjs/swagger");
const app_config_1 = require("../../src/config/app.config");
jest.mock('@nestjs/swagger');
jest.mock('@config/swagger.config', () => ({
    swaggerConfig: {},
    swaggerDocumentOptions: {},
    swaggerSetupOptions: {},
}));
describe('app.config', () => {
    let mockApp;
    beforeEach(() => {
        mockApp = {
            setGlobalPrefix: jest.fn().mockReturnThis(),
            useGlobalPipes: jest.fn().mockReturnThis(),
        };
        swagger_1.SwaggerModule.createDocument = jest.fn().mockReturnValue({});
        swagger_1.SwaggerModule.setup = jest.fn();
    });
    it('should set global prefix to "api"', () => {
        (0, app_config_1.configureApp)(mockApp);
        const setGlobalPrefixMock = mockApp.setGlobalPrefix;
        expect(setGlobalPrefixMock).toHaveBeenCalledWith('api');
        expect(setGlobalPrefixMock).toHaveBeenCalledTimes(1);
    });
    it('should configure validation pipe', () => {
        (0, app_config_1.configureApp)(mockApp);
        const useGlobalPipesMock = mockApp.useGlobalPipes;
        expect(useGlobalPipesMock).toHaveBeenCalledTimes(1);
    });
    it('should configure Swagger documentation', () => {
        (0, app_config_1.configureApp)(mockApp);
        const createDocumentSpy = jest.spyOn(swagger_1.SwaggerModule, 'createDocument');
        const setupSpy = jest.spyOn(swagger_1.SwaggerModule, 'setup');
        expect(createDocumentSpy).toHaveBeenCalledTimes(1);
        expect(setupSpy).toHaveBeenCalledTimes(1);
        expect(setupSpy).toHaveBeenCalledWith('api/docs', mockApp, expect.any(Object), expect.any(Object));
    });
});
//# sourceMappingURL=app.config.spec.js.map