"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const metrics_controller_1 = require("../../src/controllers/metrics.controller");
const metrics_config_1 = require("../../src/config/metrics.config");
describe('MetricsController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [metrics_controller_1.MetricsController],
        }).compile();
        controller = module.get(metrics_controller_1.MetricsController);
    });
    describe('getMetrics', () => {
        it('should return Prometheus metrics', async () => {
            const metricsSpy = jest
                .spyOn(metrics_config_1.register, 'metrics')
                .mockResolvedValue('test metrics');
            const result = await controller.getMetrics();
            expect(metricsSpy).toHaveBeenCalledTimes(1);
            expect(result).toBe('test metrics');
            metricsSpy.mockRestore();
        });
    });
});
//# sourceMappingURL=metrics.controller.spec.js.map