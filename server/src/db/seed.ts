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

    const employee1 = await prisma.user.create({
      data: {
        username: 'employee1',
        email: 'employee1@readysethire.com',
        passwordHash: '$2b$10$K7L/8Y3NTAQ/Gub52dvpDOhfUiuR.Ax9Q7L8rXYYQJf7/hZ7.Z.Bq', // password: admin123
        firstName: 'John',
        lastName: 'Doe',
        role: 'EMPLOYEE',
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

    const job3 = await prisma.job.create({
      data: {
        title: 'Full Stack Developer',
        description: 'Full stack developer with React and Node.js experience.',
        requirements: 'React, Node.js, PostgreSQL, 4+ years experience',
        location: 'Melbourne, VIC',
        salaryRange: '$100,000 - $140,000',
        status: 'PUBLISHED',
        userId: recruiter1.id,
        publishedAt: new Date(),
      },
    });

    const job4 = await prisma.job.create({
      data: {
        title: 'DevOps Engineer',
        description: 'DevOps engineer to manage CI/CD pipelines and cloud infrastructure.',
        requirements: 'AWS, Docker, Kubernetes, Terraform, 3+ years experience',
        location: 'Remote',
        salaryRange: '$110,000 - $150,000',
        status: 'PUBLISHED',
        userId: recruiter2.id,
        publishedAt: new Date(),
      },
    });

    console.log('✅ Jobs created');

    // Create candidates
    const candidate1 = await prisma.candidate.create({
      data: {
        userId: recruiter1.id,
        firstName: 'Alex',
        lastName: 'Johnson',
        email: 'alex.johnson@email.com',
        phone: '+61 412 345 678',
      },
    });

    const candidate2 = await prisma.candidate.create({
      data: {
        userId: recruiter2.id,
        firstName: 'Sarah',
        lastName: 'Wilson',
        email: 'sarah.wilson@email.com',
        phone: '+61 423 456 789',
      },
    });

    console.log('✅ Candidates created');

    // Create saved jobs for employee
    await prisma.savedJob.createMany({
      data: [
        {
          userId: employee1.id,
          jobId: job1.id,
        },
        {
          userId: employee1.id,
          jobId: job3.id,
        },
      ],
    });

    console.log('✅ Saved jobs created');

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