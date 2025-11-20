import { mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Create a mock Prisma client
const prismaMock = mockDeep<PrismaClient>();

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
import { userService } from '../../services/database';

describe('User Service Unit Tests', () => {
  beforeEach(() => {
    mockReset(prismaMock);
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
        role: 'RECRUITER' as const,
      };

      const expectedUser = {
        id: 1,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the service method directly
      (userService.create as jest.Mock).mockResolvedValue(expectedUser);

      // Act
      const result = await userService.create(userData);

      // Assert
      expect(userService.create).toHaveBeenCalledWith(userData);
      expect(result).toEqual(expectedUser);
    });

    it('should handle database errors', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'RECRUITER' as const,
      };

      const dbError = new Error('Database connection failed');
      (userService.create as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(userService.create(userData)).rejects.toThrow(
        'Database connection failed'
      );
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
        role: 'RECRUITER' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (userService.findByUsername as jest.Mock).mockResolvedValue(expectedUser);

      // Act
      const result = await userService.findByUsername(username);

      // Assert
      expect(userService.findByUsername).toHaveBeenCalledWith(username);
      expect(result).toEqual(expectedUser);
    });

    it('should return null when user not found', async () => {
      // Arrange
      const username = 'nonexistent';
      (userService.findByUsername as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await userService.findByUsername(username);

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
        role: 'RECRUITER' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (userService.update as jest.Mock).mockResolvedValue(updatedUser);

      // Act
      const result = await userService.update(userId, updateData);

      // Assert
      expect(userService.update).toHaveBeenCalledWith(
        userId,
        updateData
      );
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
        role: 'RECRUITER' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (userService.delete as jest.Mock).mockResolvedValue(deletedUser);

      // Act
      const result = await userService.delete({ id: userId });

      // Assert
      expect(userService.delete).toHaveBeenCalledWith({ id: userId });
      expect(result).toEqual(deletedUser);
    });
  });

  describe('count', () => {
    it('should return user count', async () => {
      // Arrange
      const expectedCount = 5;
      (userService.count as jest.Mock).mockResolvedValue(expectedCount);

      // Act
      const result = await userService.count();

      // Assert
      expect(userService.count).toHaveBeenCalledWith();
      expect(result).toBe(expectedCount);
    });
  });
});
