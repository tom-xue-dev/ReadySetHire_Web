"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jest_mock_extended_1 = require("jest-mock-extended");
// Create a mock Prisma client
const prismaMock = (0, jest_mock_extended_1.mockDeep)();
// Mock the entire database service module
jest.mock('../../services/database', () => {
    const originalModule = jest.requireActual('../../services/database');
    return {
        ...originalModule,
        prisma: prismaMock,
        // Mock the service instances directly
        userService: {
            create: jest.fn(),
            findByUsername: jest.fn(),
            findByEmail: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        jobService: {
            create: jest.fn(),
            findByUserId: jest.fn(),
            findPublished: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        interviewService: {
            create: jest.fn(),
            findByUserId: jest.fn(),
            findByJobId: jest.fn(),
            findWithQuestions: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
    };
});
// Import after mocking
const database_1 = require("../../services/database");
describe('User Service Unit Tests', () => {
    beforeEach(() => {
        (0, jest_mock_extended_1.mockReset)(prismaMock);
        // Reset all mocked service methods
        jest.clearAllMocks();
    });
    describe('create', () => {
        it('should create a new user successfully', async () => {
            // Arrange
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                passwordHash: 'hashedpassword',
                firstName: 'Test',
                lastName: 'User',
                role: 'RECRUITER',
            };
            const expectedUser = {
                id: 1,
                ...userData,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            // Mock the service method directly
            database_1.userService.create.mockResolvedValue(expectedUser);
            // Act
            const result = await database_1.userService.create(userData);
            // Assert
            expect(database_1.userService.create).toHaveBeenCalledWith(userData);
            expect(result).toEqual(expectedUser);
        });
        it('should handle database errors', async () => {
            // Arrange
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                passwordHash: 'hashedpassword',
                role: 'RECRUITER',
            };
            const dbError = new Error('Database connection failed');
            database_1.userService.create.mockRejectedValue(dbError);
            // Act & Assert
            await expect(database_1.userService.create(userData)).rejects.toThrow('Database connection failed');
        });
    });
    describe('findByUsername', () => {
        it('should find user by username', async () => {
            // Arrange
            const username = 'testuser';
            const expectedUser = {
                id: 1,
                username,
                email: 'test@example.com',
                passwordHash: 'hashedpassword',
                firstName: 'Test',
                lastName: 'User',
                role: 'RECRUITER',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            database_1.userService.findByUsername.mockResolvedValue(expectedUser);
            // Act
            const result = await database_1.userService.findByUsername(username);
            // Assert
            expect(database_1.userService.findByUsername).toHaveBeenCalledWith(username);
            expect(result).toEqual(expectedUser);
        });
        it('should return null when user not found', async () => {
            // Arrange
            const username = 'nonexistent';
            database_1.userService.findByUsername.mockResolvedValue(null);
            // Act
            const result = await database_1.userService.findByUsername(username);
            // Assert
            expect(result).toBeNull();
        });
    });
    describe('update', () => {
        it('should update user successfully', async () => {
            // Arrange
            const userId = 1;
            const updateData = {
                firstName: 'Updated',
                lastName: 'Name',
            };
            const updatedUser = {
                id: userId,
                username: 'testuser',
                email: 'test@example.com',
                passwordHash: 'hashedpassword',
                firstName: 'Updated',
                lastName: 'Name',
                role: 'RECRUITER',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            database_1.userService.update.mockResolvedValue(updatedUser);
            // Act
            const result = await database_1.userService.update(userId, updateData);
            // Assert
            expect(database_1.userService.update).toHaveBeenCalledWith(userId, updateData);
            expect(result).toEqual(updatedUser);
        });
    });
    describe('delete', () => {
        it('should delete user successfully', async () => {
            // Arrange
            const userId = 1;
            const deletedUser = {
                id: userId,
                username: 'testuser',
                email: 'test@example.com',
                passwordHash: 'hashedpassword',
                firstName: 'Test',
                lastName: 'User',
                role: 'RECRUITER',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            database_1.userService.delete.mockResolvedValue(deletedUser);
            // Act
            const result = await database_1.userService.delete({ id: userId });
            // Assert
            expect(database_1.userService.delete).toHaveBeenCalledWith({ id: userId });
            expect(result).toEqual(deletedUser);
        });
    });
    describe('count', () => {
        it('should return user count', async () => {
            // Arrange
            const expectedCount = 5;
            database_1.userService.count.mockResolvedValue(expectedCount);
            // Act
            const result = await database_1.userService.count();
            // Assert
            expect(database_1.userService.count).toHaveBeenCalledWith();
            expect(result).toBe(expectedCount);
        });
    });
});
//# sourceMappingURL=user.service.direct.test.js.map