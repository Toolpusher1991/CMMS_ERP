import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Created admin user:', {
    email: admin.email,
    name: `${admin.firstName} ${admin.lastName}`,
    role: admin.role,
  });

  // Create a regular user
  const userPassword = await bcrypt.hash('user123', 10);
  
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: userPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      isActive: true,
    },
  });

  console.log('✅ Created regular user:', {
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role,
  });

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📝 Login credentials:');
  console.log('Admin: admin@example.com / admin123');
  console.log('User:  user@example.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
