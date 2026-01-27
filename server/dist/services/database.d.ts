import { PrismaClient } from '@prisma/client';
declare let prisma: PrismaClient;
declare global {
    var __prisma: PrismaClient | undefined;
}
export default prisma;
export declare abstract class BaseService<T> {
    prisma: PrismaClient;
    model: string;
    constructor(prisma: PrismaClient, model: string);
    create(data: any): Promise<T>;
    findMany(where?: any, options?: {
        include?: any;
        select?: any;
    }): Promise<T[]>;
    findUnique(where: any, options?: {
        select?: any;
        include?: any;
    }): Promise<T | null>;
    findFirst(where: any, include?: any): Promise<T | null>;
    update(id: number, data: any): Promise<T>;
    delete(where: any): Promise<T>;
    count(where?: any): Promise<number>;
}
export declare class UserService extends BaseService<any> {
    constructor(prisma: PrismaClient);
    findByUsername(username: string): Promise<any>;
    findByEmail(email: string): Promise<any>;
    findWithJobs(userId: number): Promise<any>;
    createUser(userData: {
        username: string;
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
        companyId?: number | null;
        role?: 'ADMIN' | 'RECRUITER' | 'EMPLOYEE';
    }): Promise<any>;
    validatePassword(user: any, password: string): Promise<boolean>;
    authenticateUser(usernameOrEmail: string, password: string): Promise<any>;
    updatePassword(userId: number, newPassword: string): Promise<any>;
}
export declare class JobService extends BaseService<any> {
    constructor(prisma: PrismaClient);
    findByUserId(userId: number): Promise<any[]>;
    findPublished(): Promise<any[]>;
    findWithInterviews(jobId: number): Promise<any>;
}
export declare const userService: UserService;
export declare const jobService: JobService;
//# sourceMappingURL=database.d.ts.map