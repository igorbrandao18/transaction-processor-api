"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const health_controller_1 = require("../../src/controllers/health.controller");
const prisma_service_1 = require("../../src/config/prisma.service");
const app_config_1 = require("../../src/config/app.config");
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });
describe('Health Integration', () => {
    let app;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            controllers: [health_controller_1.HealthController],
            providers: [prisma_service_1.PrismaService],
        }).compile();
        app = moduleFixture.createNestApplication();
        (0, app_config_1.configureApp)(app);
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    it('should return health status', async () => {
        const response = await (0, supertest_1.default)(app.getHttpServer())
            .get('/api/health')
            .expect(200);
        expect(response.body.status).toBe('UP');
        expect(response.body.checks.database).toBe('UP');
    });
});
//# sourceMappingURL=health.integration.spec.js.map