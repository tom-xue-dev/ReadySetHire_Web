"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobService = exports.userService = exports.JobService = exports.UserService = exports.BaseService = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Singleton Prisma client instance
let prisma;
if (process.env.NODE_ENV === 'production') {
    prisma = new client_1.PrismaClient();
}
else {
    if (!global.__prisma) {
        // Use test database URL if in test environment
        const databaseUrl = process.env.NODE_ENV === 'test'
            ? process.env.TEST_DATABASE_URL
            : process.env.DATABASE_URL;
        global.__prisma = new client_1.PrismaClient({
            datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
            log: ['query', 'info', 'warn', 'error'],
        });
    }
    prisma = global.__prisma;
}
exports.default = prisma;
// Base service class with common CRUD operations
class BaseService {
    prisma;
    model;
    constructor(prisma, model) {
        this.prisma = prisma;
        this.model = model;
    }
    async create(data) {
        // Prisma client uses lowercase model names (e.g., 'job' not 'Job')
        const modelName = this.model.toLowerCase();
        return this.prisma[modelName].create({ data });
    }
    async findMany(where, options) {
        // Prisma client uses lowercase model names (e.g., 'job' not 'Job')
        const modelName = this.model.toLowerCase();
        const queryOptions = { where };
        if (options?.include) {
            queryOptions.include = options.include;
        }
        if (options?.select) {
            queryOptions.select = options.select;
        }
        return this.prisma[modelName].findMany(queryOptions);
    }
    async findUnique(where, options) {
        // Prisma client uses lowercase model names (e.g., 'job' not 'Job')
        const modelName = this.model.toLowerCase();
        return this.prisma[modelName].findUnique({ where, ...options });
    }
    async findFirst(where, include) {
        // Prisma client uses lowercase model names (e.g., 'job' not 'Job')
        const modelName = this.model.toLowerCase();
        return this.prisma[modelName].findFirst({ where, include });
    }
    async update(id, data) {
        // Prisma client uses lowercase model names (e.g., 'job' not 'Job')
        const modelName = this.model.toLowerCase();
        return this.prisma[modelName].update({ where: { id }, data });
    }
    async delete(where) {
        // Prisma client uses lowercase model names (e.g., 'job' not 'Job')
        const modelName = this.model.toLowerCase();
        return this.prisma[modelName].delete({ where });
    }
    async count(where) {
        // Prisma client uses lowercase model names (e.g., 'job' not 'Job')
        const modelName = this.model.toLowerCase();
        return this.prisma[modelName].count({ where });
    }
}
exports.BaseService = BaseService;
// User service with authentication methods
class UserService extends BaseService {
    constructor(prisma) {
        super(prisma, 'user');
    }
    async findByUsername(username) {
        return this.findUnique({ username });
    }
    async findByEmail(email) {
        return this.findUnique({ email });
    }
    async findWithJobs(userId) {
        return this.findUnique({ id: userId }, { include: { jobs: true } });
    }
    // Authentication methods
    async createUser(userData) {
        const { password, ...data } = userData;
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        return this.create({
            ...data,
            passwordHash,
        });
    }
    async validatePassword(user, password) {
        return bcryptjs_1.default.compare(password, user.passwordHash);
    }
    async authenticateUser(usernameOrEmail, password) {
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
    async updatePassword(userId, newPassword) {
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 12);
        return this.update(userId, { passwordHash });
    }
}
exports.UserService = UserService;
// Job service with additional methods
class JobService extends BaseService {
    constructor(prisma) {
        super(prisma, 'job');
    }
    async findByUserId(userId) {
        return this.findMany({ userId });
    }
    async findPublished() {
        return this.findMany({ status: 'PUBLISHED' });
    }
    async findWithInterviews(jobId) {
        return this.findUnique({ id: jobId }, { include: { interviews: true } });
    }
}
exports.JobService = JobService;
// Initialize all services
exports.userService = new UserService(prisma);
exports.jobService = new JobService(prisma);
//# sourceMappingURL=database.js.map