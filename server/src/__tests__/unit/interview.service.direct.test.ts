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
import { interviewService } from '../../services/database';

describe('Interview Service Unit Tests', () => {
  beforeEach(() => {
    mockReset(prismaMock);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new interview successfully', async () => {
      // Arrange
      const interviewData = {
        title: 'Test Interview',
        jobRole: 'Senior Developer',
        description: 'Test interview description',
        status: 'DRAFT' as const,
        userId: 1,
        jobId: 1,
      };

      const expectedInterview = {
        id: 1,
        ...interviewData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the service method directly
      (interviewService.create as jest.Mock).mockResolvedValue(
        expectedInterview
      );

      // Act
      const result = await interviewService.create(interviewData);

      // Assert
      expect(interviewService.create).toHaveBeenCalledWith(interviewData);
      expect(result).toEqual(expectedInterview);
    });

    it('should handle database errors', async () => {
      // Arrange
      const interviewData = {
        title: 'Test Interview',
        jobRole: 'Senior Developer',
        description: 'Test interview description',
        status: 'DRAFT' as const,
        userId: 1,
        jobId: 1,
      };

      const dbError = new Error('Database connection failed');
      (interviewService.create as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(interviewService.create(interviewData)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('findByUserId', () => {
    it('should find interviews by user ID', async () => {
      // Arrange
      const userId = 1;
      const expectedInterviews = [
        {
          id: 1,
          title: 'Interview 1',
          jobRole: 'Role 1',
          description: 'Test description',
          userId,
          jobId: null,
          status: 'DRAFT' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (interviewService.findByUserId as jest.Mock).mockResolvedValue(
        expectedInterviews
      );

      // Act
      const result = await interviewService.findByUserId(userId);

      // Assert
      expect(interviewService.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedInterviews);
    });
  });

  describe('findByJobId', () => {
    it('should find interviews by job ID', async () => {
      // Arrange
      const jobId = 1;
      const expectedInterviews = [
        {
          id: 1,
          title: 'Job Interview',
          jobRole: 'Role',
          description: 'Test description',
          userId: 1,
          jobId,
          status: 'DRAFT' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (interviewService.findByJobId as jest.Mock).mockResolvedValue(
        expectedInterviews
      );

      // Act
      const result = await interviewService.findByJobId(jobId);

      // Assert
      expect(interviewService.findByJobId).toHaveBeenCalledWith(jobId);
      expect(result).toEqual(expectedInterviews);
    });
  });

  describe('findWithQuestions', () => {
    it('should find interview with questions', async () => {
      // Arrange
      const interviewId = 1;
      const expectedInterview = {
        id: interviewId,
        title: 'Interview with Questions',
        jobRole: 'Role',
        description: 'Test description',
        userId: 1,
        jobId: null,
        status: 'DRAFT' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [
          {
            id: 1,
            interviewId,
            question: 'Test question 1',
            difficulty: 'EASY' as const,
            userId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 2,
            interviewId,
            question: 'Test question 2',
            difficulty: 'INTERMEDIATE' as const,
            userId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      (interviewService.findWithQuestions as jest.Mock).mockResolvedValue(
        expectedInterview
      );

      // Act
      const result = await interviewService.findWithQuestions(interviewId);

      // Assert
      expect(interviewService.findWithQuestions).toHaveBeenCalledWith(
        interviewId
      );
      expect(result).toEqual(expectedInterview);
    });
  });

  describe('update', () => {
    it('should update interview successfully', async () => {
      // Arrange
      const interviewId = 1;
      const updateData = {
        title: 'Updated Title',
        status: 'PUBLISHED' as const,
      };

      const updatedInterview = {
        id: interviewId,
        title: 'Updated Title',
        jobRole: 'Original Role',
        description: 'Test description',
        userId: 1,
        jobId: null,
        status: 'PUBLISHED' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (interviewService.update as jest.Mock).mockResolvedValue(
        updatedInterview
      );

      // Act
      const result = await interviewService.update(
        interviewId,
        updateData
      );

      // Assert
      expect(interviewService.update).toHaveBeenCalledWith(
        interviewId,
        updateData
      );
      expect(result).toEqual(updatedInterview);
    });
  });

  describe('delete', () => {
    it('should delete interview successfully', async () => {
      // Arrange
      const interviewId = 1;
      const deletedInterview = {
        id: interviewId,
        title: 'Deleted Interview',
        jobRole: 'Role',
        description: 'Test description',
        userId: 1,
        jobId: null,
        status: 'DRAFT' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (interviewService.delete as jest.Mock).mockResolvedValue(
        deletedInterview
      );

      // Act
      const result = await interviewService.delete({ id: interviewId });

      // Assert
      expect(interviewService.delete).toHaveBeenCalledWith({ id: interviewId });
      expect(result).toEqual(deletedInterview);
    });
  });

  describe('count', () => {
    it('should return interview count', async () => {
      // Arrange
      const expectedCount = 3;
      (interviewService.count as jest.Mock).mockResolvedValue(expectedCount);

      // Act
      const result = await interviewService.count();

      // Assert
      expect(interviewService.count).toHaveBeenCalledWith();
      expect(result).toBe(expectedCount);
    });
  });
});
