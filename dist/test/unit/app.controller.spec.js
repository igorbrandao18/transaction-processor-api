"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const _app_controller_1 = require("../../src/app.controller");
const _app_service_1 = require("../../src/app.service");
describe('AppController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [_app_controller_1.AppController],
            providers: [_app_service_1.AppService],
        }).compile();
        controller = module.get(_app_controller_1.AppController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
    it('should return "Hello World!"', () => {
        expect(controller.getHello()).toBe('Hello World!');
    });
});
//# sourceMappingURL=app.controller.spec.js.map