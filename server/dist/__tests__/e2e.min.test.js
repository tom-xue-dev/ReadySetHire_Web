"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../../src/index"));
describe('Minimal E2E: auth -> jobs -> interviews -> applicants', () => {
    let token = '';
    it('health', async () => {
        const res = await (0, supertest_1.default)(index_1.default).get('/health');
        expect(res.status).toBe(200);
    });
    it('login', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/login')
            .send({ username: 'recruiter1', password: 'admin123' });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeTruthy();
        token = res.body.token;
    });
    it('list jobs', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .get('/api/jobs')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
    });
    it('list interviews', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .get('/api/interviews')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
    });
    it('list applicants', async () => {
        const res = await (0, supertest_1.default)(index_1.default)
            .get('/api/applicants')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
    });
});
//# sourceMappingURL=e2e.min.test.js.map