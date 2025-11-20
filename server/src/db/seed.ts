import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Create users
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@readysethire.com',
        passwordHash: '$2b$10$K7L/8Y3NTAQ/Gub52dvpDOhfUiuR.Ax9Q7L8rXYYQJf7/hZ7.Z.Bq', // password: admin123
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      },
    });

    const recruiter1 = await prisma.user.create({
      data: {
        username: 'recruiter1',
        email: 'recruiter1@readysethire.com',
        passwordHash: '$2b$10$K7L/8Y3NTAQ/Gub52dvpDOhfUiuR.Ax9Q7L8rXYYQJf7/hZ7.Z.Bq', // password: admin123
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'RECRUITER',
      },
    });

    const recruiter2 = await prisma.user.create({
      data: {
        username: 'recruiter2',
        email: 'recruiter2@readysethire.com',
        passwordHash: '$2b$10$K7L/8Y3NTAQ/Gub52dvpDOhfUiuR.Ax9Q7L8rXYYQJf7/hZ7.Z.Bq', // password: admin123
        firstName: 'Michael',
        lastName: 'Chen',
        role: 'RECRUITER',
      },
    });

    console.log('✅ Users created');

    // Create jobs
    const job1 = await prisma.job.create({
      data: {
        title: 'Frontend Developer',
        description: 'Looking for an experienced React developer to join our team.',
        requirements: 'React, TypeScript, 3+ years experience',
        location: 'Brisbane, QLD',
        salaryRange: '$80,000 - $120,000',
        status: 'PUBLISHED',
        userId: recruiter1.id,
        publishedAt: new Date(),
      },
    });

    const job2 = await prisma.job.create({
      data: {
        title: 'Backend Engineer',
        description: 'Node.js backend engineer for scalable applications.',
        requirements: 'Node.js, PostgreSQL, Docker, 2+ years experience',
        location: 'Sydney, NSW',
        salaryRange: '$90,000 - $130,000',
        status: 'PUBLISHED',
        userId: recruiter2.id,
        publishedAt: new Date(),
      },
    });

    console.log('✅ Jobs created');

    // Create interviews
    const interview1 = await prisma.interview.create({
      data: {
        title: 'Frontend Developer Technical Interview',
        jobRole: 'Frontend Developer',
        description: 'Technical interview focusing on React and TypeScript skills.',
        status: 'PUBLISHED',
        userId: recruiter1.id,
        jobId: job1.id,
      },
    });

    const interview2 = await prisma.interview.create({
      data: {
        title: 'Backend Engineer System Design',
        jobRole: 'Backend Engineer',
        description: 'System design interview for backend engineering role.',
        status: 'PUBLISHED',
        userId: recruiter2.id,
        jobId: job2.id,
      },
    });

    console.log('✅ Interviews created');

    // Create questions
    const questions = [
      {
        interviewId: interview1.id,
        question: 'What is the difference between React functional and class components?',
        difficulty: 'EASY' as const,
        userId: recruiter1.id,
      },
      {
        interviewId: interview1.id,
        question: 'Explain the concept of React hooks and provide examples.',
        difficulty: 'INTERMEDIATE' as const,
        userId: recruiter1.id,
      },
      {
        interviewId: interview1.id,
        question: 'How would you optimize a React application for performance?',
        difficulty: 'ADVANCED' as const,
        userId: recruiter1.id,
      },
      {
        interviewId: interview2.id,
        question: 'Explain the difference between SQL and NoSQL databases.',
        difficulty: 'EASY' as const,
        userId: recruiter2.id,
      },
      {
        interviewId: interview2.id,
        question: 'Design a scalable chat application architecture.',
        difficulty: 'ADVANCED' as const,
        userId: recruiter2.id,
      },
    ];

    for (const questionData of questions) {
      await prisma.question.create({
        data: questionData,
      });
    }

    console.log('✅ Questions created');

    // Create applicants
    const applicants = [
      {
        interviewId: interview1.id,
        firstName: 'Alex',
        lastName: 'Johnson',
        phoneNumber: '+61 412 345 678',
        emailAddress: 'alex.johnson@email.com',
        interviewStatus: 'NOT_STARTED' as const,
        userId: admin.id,
      },
      {
        interviewId: interview1.id,
        firstName: 'Sarah',
        lastName: 'Wilson',
        phoneNumber: '+61 423 456 789',
        emailAddress: 'sarah.wilson@email.com',
        interviewStatus: 'COMPLETED' as const,
        userId: admin.id,
      },
      {
        interviewId: interview2.id,
        firstName: 'Michael',
        lastName: 'Brown',
        phoneNumber: '+61 434 567 890',
        emailAddress: 'michael.brown@email.com',
        interviewStatus: 'NOT_STARTED' as const,
        userId: admin.id,
      },
    ];

    for (const applicantData of applicants) {
      await prisma.applicant.create({
        data: applicantData,
      });
    }

    console.log('✅ Applicants created');

    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed().catch(e => {
    console.error(e);
    process.exit(1);
  });
}

export default seed;