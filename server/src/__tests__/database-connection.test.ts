import { testPrisma } from './setup';

describe('Database Connection', () => {
  test('should connect to test database', async () => {
    const result = await testPrisma.$queryRaw`SELECT 1 as test`;
    expect(result).toBeDefined();
  });

  test('should have all required tables', async () => {
    const tables = await testPrisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const tableNames = (tables as any[]).map(t => t.table_name);

    expect(tableNames).toContain('users');
    expect(tableNames).toContain('jobs');
    expect(tableNames).toContain('interviews');
    expect(tableNames).toContain('questions');
    expect(tableNames).toContain('applicants');
    expect(tableNames).toContain('applicant_answers');
  });

  test('should have proper foreign key constraints', async () => {
    const constraints = await testPrisma.$queryRaw`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, tc.constraint_name
    `;

    expect(constraints).toBeDefined();
    expect((constraints as any[]).length).toBeGreaterThan(0);
  });

  test('should handle connection errors gracefully', async () => {
    const invalidPrisma = new (require('@prisma/client').PrismaClient)({
      datasources: {
        db: {
          url: 'postgresql://invalid:invalid@localhost:9999/invalid',
        },
      },
    });

    await expect(invalidPrisma.$connect()).rejects.toThrow();
    await invalidPrisma.$disconnect();
  });
});
