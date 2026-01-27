"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testPrisma = void 0;
const client_1 = require("@prisma/client");
// Test database client
exports.testPrisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.TEST_DATABASE_URL ||
                'postgresql://readysethire_user:readysethire_password@localhost:5432/readysethire_test?schema=public',
        },
    },
    log: ['error'],
});
// Clean up after each test
afterEach(async () => {
    // Clean up test data in reverse order of dependencies
    await exports.testPrisma.jobApplication.deleteMany();
    await exports.testPrisma.savedJob.deleteMany();
    await exports.testPrisma.candidate.deleteMany();
    await exports.testPrisma.job.deleteMany();
    await exports.testPrisma.user.deleteMany();
});
// Clean up after all tests
afterAll(async () => {
    await exports.testPrisma.$disconnect();
});
//# sourceMappingURL=setup.js.map