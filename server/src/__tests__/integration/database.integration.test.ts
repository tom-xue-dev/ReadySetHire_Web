import { testPrisma } from '../setup';
import {
  userService,
  jobService,
  interviewService,
  questionService,
  applicantService,
  applicantAnswerService,
} from '../../services/database';

describe('Database Integration Tests', () => {
  // Clean up after each test
  afterEach(async () => {
    await testPrisma.applicantAnswer.deleteMany();
    await testPrisma.applicant.deleteMany();
    await testPrisma.question.deleteMany();
    await testPrisma.interview.deleteMany();
    await testPrisma.job.deleteMany();
    await testPrisma.user.deleteMany();
  });

  describe('User Integration Tests', () => {
    it('should create and retrieve user with real database', async () => {
      // Arrange
      const userData = {
        username: 'integrationuser',
        email: 'integration@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Integration',
        lastName: 'Test',
        role: 'RECRUITER' as const,
      };

      // Act
      const createdUser = await userService.create(userData);
      const retrievedUser = await userService.findByUsername('integrationuser');

      // Assert
      expect(createdUser).toBeDefined();
      expect(createdUser.username).toBe(userData.username);
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.username).toBe(userData.username);
      expect(retrievedUser?.email).toBe(userData.email);
    });

    it('should handle user relationships correctly', async () => {
      // Arrange
      const user = await userService.create({
        username: 'reluser',
        email: 'rel@example.com',
        passwordHash: 'hashedpassword',
        role: 'RECRUITER' as const,
      });

      // Act
      const job = await jobService.create({
        title: 'Integration Job',
        description: 'Test job',
        userId: user.id,
        status: 'DRAFT' as const,
      });

      const interview = await interviewService.create({
        title: 'Integration Interview',
        jobRole: 'Developer',
        userId: user.id,
        jobId: job.id,
        status: 'DRAFT' as const,
      });

      // Assert
      expect(job.userId).toBe(user.id);
      expect(interview.userId).toBe(user.id);
      expect(interview.jobId).toBe(job.id);
    });
  });

  describe('Job Integration Tests', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await userService.create({
        username: 'jobuser',
        email: 'job@example.com',
        passwordHash: 'hashedpassword',
        role: 'RECRUITER' as const,
      });
    });

    it('should create job with proper relationships', async () => {
      // Arrange
      const jobData = {
        title: 'Integration Test Job',
        description: 'Job for integration testing',
        requirements: 'Testing skills',
        location: 'Remote',
        salaryRange: '$60,000 - $80,000',
        status: 'PUBLISHED' as const,
        userId: testUser.id,
      };

      // Act
      const job = await jobService.create(jobData);
      const userJobs = await jobService.findByUserId(testUser.id);
      const publishedJobs = await jobService.findPublished();

      // Assert
      expect(job.title).toBe(jobData.title);
      expect(job.userId).toBe(testUser.id);
      expect(userJobs).toHaveLength(1);
      expect(publishedJobs).toHaveLength(1);
      expect(publishedJobs[0].status).toBe('PUBLISHED');
    });

    it('should update job status correctly', async () => {
      // Arrange
      const job = await jobService.create({
        title: 'Draft Job',
        description: 'Will be published',
        userId: testUser.id,
        status: 'DRAFT' as const,
      });

      // Act
      const updatedJob = await jobService.update(
        job.id,
        { status: 'PUBLISHED' as const }
      );

      // Assert
      expect(updatedJob?.status).toBe('PUBLISHED');
    });
  });

  describe('Interview Integration Tests', () => {
    let testUser: any;
    let testJob: any;

    beforeEach(async () => {
      testUser = await userService.create({
        username: 'interviewuser',
        email: 'interview@example.com',
        passwordHash: 'hashedpassword',
        role: 'RECRUITER' as const,
      });

      testJob = await jobService.create({
        title: 'Test Job',
        description: 'Test description',
        userId: testUser.id,
        status: 'PUBLISHED' as const,
      });
    });

    it('should create interview with questions', async () => {
      // Arrange
      const interview = await interviewService.create({
        title: 'Full Interview Test',
        jobRole: 'Senior Developer',
        description: 'Complete interview test',
        status: 'PUBLISHED' as const,
        userId: testUser.id,
        jobId: testJob.id,
      });

      // Act
      const question1 = await questionService.create({
        interviewId: interview.id,
        question: 'What is your experience with TypeScript?',
        difficulty: 'INTERMEDIATE' as const,
        userId: testUser.id,
      });

      const question2 = await questionService.create({
        interviewId: interview.id,
        question: 'Explain the difference between let and const.',
        difficulty: 'EASY' as const,
        userId: testUser.id,
      });

      const interviewWithQuestions = await interviewService.findWithQuestions(
        interview.id
      );

      // Assert
      expect(interviewWithQuestions?.questions).toHaveLength(2);
      expect(interviewWithQuestions?.questions[0].question).toBe(
        question1.question
      );
      expect(interviewWithQuestions?.questions[1].question).toBe(
        question2.question
      );
    });

    it('should handle interview-applicant relationship', async () => {
      // Arrange
      const interview = await interviewService.create({
        title: 'Applicant Test Interview',
        jobRole: 'Developer',
        userId: testUser.id,
        status: 'PUBLISHED' as const,
      });

      // Act
      const applicant = await applicantService.create({
        interviewId: interview.id,
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+61 412 345 678',
        emailAddress: 'john.doe@example.com',
        interviewStatus: 'NOT_STARTED' as const,
        userId: testUser.id,
      });

      const interviewApplicants = await applicantService.findMany({
        interviewId: interview.id,
      });

      // Assert
      expect(applicant.interviewId).toBe(interview.id);
      expect(interviewApplicants).toHaveLength(1);
      expect(interviewApplicants[0].firstName).toBe('John');
    });
  });

  describe('Complete Workflow Integration Test', () => {
    it('should handle complete interview workflow', async () => {
      // 1. Create user
      const user = await userService.create({
        username: 'workflowuser',
        email: 'workflow@example.com',
        passwordHash: 'hashedpassword',
        role: 'RECRUITER' as const,
      });

      // 2. Create job
      const job = await jobService.create({
        title: 'Workflow Test Job',
        description: 'Job for workflow testing',
        userId: user.id,
        status: 'PUBLISHED' as const,
      });

      // 3. Create interview
      const interview = await interviewService.create({
        title: 'Workflow Interview',
        jobRole: 'Full Stack Developer',
        userId: user.id,
        jobId: job.id,
        status: 'PUBLISHED' as const,
      });

      // 4. Add questions
      const question1 = await questionService.create({
        interviewId: interview.id,
        question: 'Describe your experience with React.',
        difficulty: 'INTERMEDIATE' as const,
        userId: user.id,
      });

      const question2 = await questionService.create({
        interviewId: interview.id,
        question: 'What is your approach to testing?',
        difficulty: 'ADVANCED' as const,
        userId: user.id,
      });

      // 5. Add applicant
      const applicant = await applicantService.create({
        interviewId: interview.id,
        firstName: 'Jane',
        lastName: 'Smith',
        emailAddress: 'jane.smith@example.com',
        interviewStatus: 'NOT_STARTED' as const,
        userId: user.id,
      });

      // 6. Add answers
      const answer1 = await applicantAnswerService.create({
        interviewId: interview.id,
        questionId: question1.id,
        applicantId: applicant.id,
        answer:
          'I have 3 years of experience with React, including hooks and context.',
        userId: user.id,
      });

      const answer2 = await applicantAnswerService.create({
        interviewId: interview.id,
        questionId: question2.id,
        applicantId: applicant.id,
        answer: 'I prefer TDD approach with Jest and React Testing Library.',
        userId: user.id,
      });

      // 7. Update applicant status
      const updatedApplicant = await applicantService.update(
        applicant.id,
        { interviewStatus: 'COMPLETED' as const }
      );

      // Assertions
      expect(user.id).toBeDefined();
      expect(job.userId).toBe(user.id);
      expect(interview.jobId).toBe(job.id);
      expect(interview.userId).toBe(user.id);
      expect(question1.interviewId).toBe(interview.id);
      expect(question2.interviewId).toBe(interview.id);
      expect(applicant.interviewId).toBe(interview.id);
      expect(answer1.questionId).toBe(question1.id);
      expect(answer1.applicantId).toBe(applicant.id);
      expect(answer2.questionId).toBe(question2.id);
      expect(answer2.applicantId).toBe(applicant.id);
      expect(updatedApplicant?.interviewStatus).toBe('COMPLETED');

      // Verify relationships
      const interviewWithQuestions = await interviewService.findWithQuestions(
        interview.id
      );
      const applicantAnswers = await applicantAnswerService.findByApplicantId(
        applicant.id
      );
      const questionAnswers = await applicantAnswerService.findByQuestionId(
        question1.id
      );

      expect(interviewWithQuestions?.questions).toHaveLength(2);
      expect(applicantAnswers).toHaveLength(2);
      expect(questionAnswers).toHaveLength(1);
    });
  });
});
