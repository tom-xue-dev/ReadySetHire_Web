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
describe('Interview Service Unit Tests', () => {
    beforeEach(() => {
        (0, jest_mock_extended_1.mockReset)(prismaMock);
        jest.clearAllMocks();
    });
    describe('create', () => {
        it('should create a new interview successfully', async () => {
            // Arrange
            const interviewData = {
                title: 'Test Interview',
                jobRole: 'Senior Developer',
                description: 'Test interview description',
                status: 'DRAFT',
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
            database_1.interviewService.create.mockResolvedValue(expectedInterview);
            // Act
            const result = await database_1.interviewService.create(interviewData);
            // Assert
            expect(database_1.interviewService.create).toHaveBeenCalledWith(interviewData);
            expect(result).toEqual(expectedInterview);
        });
        it('should handle database errors', async () => {
            // Arrange
            const interviewData = {
                title: 'Test Interview',
                jobRole: 'Senior Developer',
                description: 'Test interview description',
                status: 'DRAFT',
                userId: 1,
                jobId: 1,
            };
            const dbError = new Error('Database connection failed');
            database_1.interviewService.create.mockRejectedValue(dbError);
            // Act & Assert
            await expect(database_1.interviewService.create(interviewData)).rejects.toThrow('Database connection failed');
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
                    status: 'DRAFT',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];
            database_1.interviewService.findByUserId.mockResolvedValue(expectedInterviews);
            // Act
            const result = await database_1.interviewService.findByUserId(userId);
            // Assert
            expect(database_1.interviewService.findByUserId).toHaveBeenCalledWith(userId);
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
                    status: 'DRAFT',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];
            database_1.interviewService.findByJobId.mockResolvedValue(expectedInterviews);
            // Act
            const result = await database_1.interviewService.findByJobId(jobId);
            // Assert
            expect(database_1.interviewService.findByJobId).toHaveBeenCalledWith(jobId);
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
                status: 'DRAFT',
                createdAt: new Date(),
                updatedAt: new Date(),
                questions: [
                    {
                        id: 1,
                        interviewId,
                        question: 'Test question 1',
                        difficulty: 'EASY',
                        userId: 1,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    {
                        id: 2,
                        interviewId,
                        question: 'Test question 2',
                        difficulty: 'INTERMEDIATE',
                        userId: 1,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ],
            };
            database_1.interviewService.findWithQuestions.mockResolvedValue(expectedInterview);
            // Act
            const result = await database_1.interviewService.findWithQuestions(interviewId);
            // Assert
            expect(database_1.interviewService.findWithQuestions).toHaveBeenCalledWith(interviewId);
            expect(result).toEqual(expectedInterview);
        });
    });
    describe('update', () => {
        it('should update interview successfully', async () => {
            // Arrange
            const interviewId = 1;
            const updateData = {
                title: 'Updated Title',
                status: 'PUBLISHED',
            };
            const updatedInterview = {
                id: interviewId,
                title: 'Updated Title',
                jobRole: 'Original Role',
                description: 'Test description',
                userId: 1,
                jobId: null,
                status: 'PUBLISHED',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            database_1.interviewService.update.mockResolvedValue(updatedInterview);
            // Act
            const result = await database_1.interviewService.update(interviewId, updateData);
            // Assert
            expect(database_1.interviewService.update).toHaveBeenCalledWith(interviewId, updateData);
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
                status: 'DRAFT',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            database_1.interviewService.delete.mockResolvedValue(deletedInterview);
            // Act
            const result = await database_1.interviewService.delete({ id: interviewId });
            // Assert
            expect(database_1.interviewService.delete).toHaveBeenCalledWith({ id: interviewId });
            expect(result).toEqual(deletedInterview);
        });
    });
    describe('count', () => {
        it('should return interview count', async () => {
            // Arrange
            const expectedCount = 3;
            database_1.interviewService.count.mockResolvedValue(expectedCount);
            // Act
            const result = await database_1.interviewService.count();
            // Assert
            expect(database_1.interviewService.count).toHaveBeenCalledWith();
            expect(result).toBe(expectedCount);
        });
    });
});
//# sourceMappingURL=interview.service.test.js.map