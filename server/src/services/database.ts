import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Singleton Prisma client instance
let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    // Use test database URL if in test environment
    const databaseUrl =
      process.env.NODE_ENV === 'test'
        ? process.env.TEST_DATABASE_URL
        : process.env.DATABASE_URL;

    global.__prisma = new PrismaClient({
      datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

export default prisma;

// Base service class with common CRUD operations
export abstract class BaseService<T> {
  public prisma: PrismaClient;
  public model: string;

  constructor(prisma: PrismaClient, model: string) {
    this.prisma = prisma;
    this.model = model;
  }

  async create(data: any): Promise<T> {
    // Prisma client uses lowercase model names (e.g., 'job' not 'Job')
    const modelName = this.model.toLowerCase();
    return (this.prisma as any)[modelName].create({ data });
  }

  async findMany(where?: any, options?: { include?: any; select?: any }): Promise<T[]> {
    // Prisma client uses lowercase model names (e.g., 'job' not 'Job')
    const modelName = this.model.toLowerCase();
    const queryOptions: any = { where };
    if (options?.include) {
      queryOptions.include = options.include;
    }
    if (options?.select) {
      queryOptions.select = options.select;
    }
    return (this.prisma as any)[modelName].findMany(queryOptions);
  }

  async findUnique(where: any, options?: { select?: any; include?: any }): Promise<T | null> {
    // Prisma client uses lowercase model names (e.g., 'job' not 'Job')
    const modelName = this.model.toLowerCase();
    return (this.prisma as any)[modelName].findUnique({ where, ...options });
  }

  async findFirst(where: any, include?: any): Promise<T | null> {
    // Prisma client uses lowercase model names (e.g., 'job' not 'Job')
    const modelName = this.model.toLowerCase();
    return (this.prisma as any)[modelName].findFirst({ where, include });
  }

  async update(id: number, data: any): Promise<T> {
    // Prisma client uses lowercase model names (e.g., 'job' not 'Job')
    const modelName = this.model.toLowerCase();
    return (this.prisma as any)[modelName].update({ where: { id }, data });
  }

  async delete(where: any): Promise<T> {
    // Prisma client uses lowercase model names (e.g., 'job' not 'Job')
    const modelName = this.model.toLowerCase();
    return (this.prisma as any)[modelName].delete({ where });
  }

  async count(where?: any): Promise<number> {
    // Prisma client uses lowercase model names (e.g., 'job' not 'Job')
    const modelName = this.model.toLowerCase();
    return (this.prisma as any)[modelName].count({ where });
  }
}

// User service with authentication methods
export class UserService extends BaseService<any> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'user');
  }

  async findByUsername(username: string) {
    return this.findUnique({ username });
  }

  async findByEmail(email: string) {
    return this.findUnique({ email });
  }

  async findWithJobs(userId: number) {
    return this.findUnique({ id: userId }, { include: { jobs: true } });
  }

  // Authentication methods
  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: 'ADMIN' | 'RECRUITER' | 'EMPLOYEE';
  }) {
    const { password, ...data } = userData;
    const passwordHash = await bcrypt.hash(password, 12);
    
    return this.create({
      ...data,
      passwordHash,
    });
  }

  async validatePassword(user: any, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async authenticateUser(usernameOrEmail: string, password: string) {
    // Try to find user by username or email
    const user = await this.findByUsername(usernameOrEmail) || 
                 await this.findByEmail(usernameOrEmail);
    
    if (!user) {
      return null;
    }

    const isValidPassword = await this.validatePassword(user, password);
    if (!isValidPassword) {
      return null;
    }

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updatePassword(userId: number, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    return this.update(userId, { passwordHash });
  }
}

// Job service with additional methods
export class JobService extends BaseService<any> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'job');
  }

  async findByUserId(userId: number) {
    return this.findMany({ userId });
  }

  async findPublished() {
    return this.findMany({ status: 'PUBLISHED' });
  }

  async findWithInterviews(jobId: number) {
    return this.findUnique({ id: jobId }, { include: { interviews: true } });
  }
}

// Initialize all services
export const userService = new UserService(prisma);
export const jobService = new JobService(prisma);
