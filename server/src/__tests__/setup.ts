import { PrismaClient } from '@prisma/client';

// Test database client
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.TEST_DATABASE_URL ||
        'postgresql://readysethire_user:readysethire_password@localhost:5432/readysethire_test?schema=public',
    },
  },
  log: ['error'],
});

// Clean up after each test
afterEach(async () => {
  // Clean up test data in reverse order of dependencies
  await testPrisma.jobApplication.deleteMany();
  await testPrisma.savedJob.deleteMany();
  await testPrisma.candidate.deleteMany();
  await testPrisma.job.deleteMany();
  await testPrisma.user.deleteMany();
});

// Clean up after all tests
afterAll(async () => {
  await testPrisma.$disconnect();
});
