import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const username = process.argv[2] || 'admin';
  const email = process.argv[3] || 'admin@readysethire.com';
  const password = process.argv[4] || 'admin123';

  console.log(`Creating admin user: ${username} (${email})`);

  // Check if admin already exists
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { email },
      ],
    },
  });

  if (existing) {
    console.log('❌ User already exists. Updating password...');
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, role: 'ADMIN' },
    });
    console.log('✅ Admin password updated successfully!');
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin user created successfully!');
  }

  console.log(`\nLogin credentials:`);
  console.log(`  Username: ${username}`);
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);

  await prisma.$disconnect();
}

createAdmin().catch(console.error);
