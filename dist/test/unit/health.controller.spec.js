"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const health_controller_1 = require("../../src/controllers/health.controller");
const prisma_service_1 = require("../../src/config/prisma.service");
describe('HealthController', () => {
    let controller;
    let prismaService;
    beforeEach(async () => {
        const mockPrisma = {
            $queryRaw: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            controllers: [health_controller_1.HealthController],
            providers: [
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrisma,
                },
            ],
        }).compile();
        controller = module.get(health_controller_1.HealthController);
        prismaService = module.get(prisma_service_1.PrismaService);
    });
    describe('check', () => {
        it('should return UP status when database is healthy', async () => {
            prismaService.$queryRaw = jest
                .fn()
                .mockResolvedValue([{ '?column?': 1 }]);
            const result = await controller.check();
            expect(result.status).toBe('UP');
            expect(result.checks.database).toBe('UP');
            expect(result.service).toBe('transaction-processor-api');
            expect(result.timestamp).toBeDefined();
        });
        it('should return DOWN status when database connection fails', async () => {
            prismaService.$queryRaw = jest
                .fn()
                .mockRejectedValue(new Error('Connection failed'));
            const result = await controller.check();
            expect(result.status).toBe('DOWN');
            expect(result.checks.database).toBe('DOWN');
        });
        it('should handle unknown errors', async () => {
            prismaService.$queryRaw = jest.fn().mockRejectedValue('Unknown error');
            const result = await controller.check();
            expect(result.status).toBe('DOWN');
            expect(result.checks.database).toBe('DOWN');
        });
    });
});
//# sourceMappingURL=health.controller.spec.js.map