import { PrismaClient } from '@prisma/client';

// Use DATABASE_URL from environment (set by CI or local .env)
const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://readysethire_user:readysethire_password@localhost:5432/readysethire?schema=public';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: ['error'],
});

describe('Database Integration Tests', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should connect to database', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    expect(result).toBeDefined();
  });

  test('should have all required tables', async () => {
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const tableNames = tables.map((t) => t.table_name);

    // Core tables from current schema
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('jobs');
    expect(tableNames).toContain('candidates');
    expect(tableNames).toContain('job_applications');
    expect(tableNames).toContain('resumes');
    expect(tableNames).toContain('saved_jobs');
  });

  test('should have user table with correct columns', async () => {
    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      ORDER BY ordinal_position
    `;

    const columnNames = columns.map((c) => c.column_name);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('username');
    expect(columnNames).toContain('email');
    expect(columnNames).toContain('password_hash');
    expect(columnNames).toContain('role');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('updated_at');
  });

  test('should have proper foreign key constraints', async () => {
    const constraints = await prisma.$queryRaw<Array<{ constraint_name: string }>>`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints AS tc
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      ORDER BY tc.constraint_name
    `;

    expect(constraints).toBeDefined();
    expect(constraints.length).toBeGreaterThan(0);
  });

  test('should be able to create and query a user', async () => {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        passwordHash: 'testhash',
        role: 'RECRUITER',
      },
    });

    expect(testUser.id).toBeDefined();
    expect(testUser.username).toContain('testuser_');

    // Clean up
    await prisma.user.delete({ where: { id: testUser.id } });
  });
});
