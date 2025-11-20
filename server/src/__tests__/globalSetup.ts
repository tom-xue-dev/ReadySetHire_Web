import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const TEST_DATABASE_URL =
  'postgresql://readysethire_user:readysethire_password@localhost:5432/readysethire_test?schema=public';

export default async function globalSetup() {
  console.log('🚀 Setting up test environment...');

  try {
    // Set environment variables for tests
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL =
      'postgresql://readysethire_user:readysethire_password@localhost:5432/readysethire?schema=public';
    process.env.TEST_DATABASE_URL = TEST_DATABASE_URL;

    // Check if we're running in CI environment (GitHub Actions)
    const isCI =
      process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

    if (isCI) {
      console.log(
        '🎭 Running in CI environment, using provided PostgreSQL service'
      );

      // In CI, PostgreSQL is already running as a service
      // Just wait for it to be ready
      console.log('⏳ Waiting for database to be ready...');
      let retries = 30;
      while (retries > 0) {
        try {
          execSync('pg_isready -h localhost -p 5432 -U readysethire_user', {
            stdio: 'pipe',
          });
          console.log('✅ Database is ready');
          break;
        } catch {
          retries--;
          if (retries === 0) throw new Error('Database failed to start');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } else {
      console.log('🐳 Starting Docker containers...');

      // Check if containers are already running
      try {
        const result = execSync('docker-compose ps -q postgres', {
          encoding: 'utf8',
        });
        if (!result.trim()) {
          // Start PostgreSQL container
          execSync('docker-compose up -d postgres', { stdio: 'inherit' });

          // Wait for database to be ready
          console.log('⏳ Waiting for database to be ready...');
          let retries = 30;
          while (retries > 0) {
            try {
              execSync(
                'docker-compose exec -T postgres pg_isready -U readysethire_user -d readysethire',
                { stdio: 'pipe' }
              );
              break;
            } catch {
              retries--;
              if (retries === 0) throw new Error('Database failed to start');
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } else {
          console.log('✅ PostgreSQL container already running');
        }
      } catch (error) {
        console.log('🐳 Starting PostgreSQL container...');
        execSync('docker-compose up -d postgres', { stdio: 'inherit' });

        // Wait for database to be ready
        console.log('⏳ Waiting for database to be ready...');
        let retries = 30;
        while (retries > 0) {
          try {
            execSync(
              'docker-compose exec -T postgres pg_isready -U readysethire_user -d readysethire',
              { stdio: 'pipe' }
            );
            break;
          } catch {
            retries--;
            if (retries === 0) throw new Error('Database failed to start');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // Create test database if it doesn't exist (only for local Docker)
      try {
        execSync(
          'docker-compose exec -T postgres psql -U readysethire_user -d readysethire -c "CREATE DATABASE readysethire_test;"',
          { stdio: 'pipe' }
        );
      } catch (error) {
        // Database might already exist, continue
      }
    }

    console.log('🗄️ Setting up test database schema...');

    // Reset the test database
    execSync('npx prisma migrate reset --force', {
      env: {
        ...process.env,
        DATABASE_URL: TEST_DATABASE_URL,
      },
      stdio: 'inherit',
    });

    console.log('✅ Test environment setup complete');
  } catch (error) {
    console.error('❌ Test environment setup failed:', error);
    throw error;
  }
}
