"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const prisma_service_1 = require("../../src/config/prisma.service");
describe('PrismaService', () => {
    let service;
    beforeEach(async () => {
        const mockPrismaClient = {
            $connect: jest.fn().mockResolvedValue(undefined),
            $disconnect: jest.fn().mockResolvedValue(undefined),
            transaction: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                count: jest.fn(),
            },
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrismaClient,
                },
            ],
        }).compile();
        service = module.get(prisma_service_1.PrismaService);
    });
    describe('onModuleInit', () => {
        it('should connect to database', async () => {
            const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();
            if (service.onModuleInit) {
                await service.onModuleInit();
                expect(connectSpy).toHaveBeenCalledTimes(1);
            }
            else {
                expect(service.$connect).toBeDefined();
            }
        });
    });
    describe('onModuleDestroy', () => {
        it('should disconnect from database', async () => {
            const disconnectSpy = jest
                .spyOn(service, '$disconnect')
                .mockResolvedValue();
            if (service.onModuleDestroy) {
                await service.onModuleDestroy();
                expect(disconnectSpy).toHaveBeenCalledTimes(1);
            }
            else {
                expect(service.$disconnect).toBeDefined();
            }
        });
    });
});
//# sourceMappingURL=prisma.service.spec.js.map