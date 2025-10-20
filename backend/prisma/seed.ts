import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Check if admin already exists
  let admin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });

  if (!admin) {
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    console.log('✅ Created admin user:', {
      email: admin.email,
      name: `${admin.firstName} ${admin.lastName}`,
      role: admin.role,
    });
  } else {
    console.log('✅ Admin user already exists');
  }

  // Check if user already exists
  let user = await prisma.user.findUnique({
    where: { email: 'user@example.com' },
  });

  if (!user) {
    // Create a regular user
    const userPassword = await bcrypt.hash('user123', 10);
    
    user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        password: userPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        isActive: true,
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    console.log('✅ Created regular user:', {
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
    });
  } else {
    console.log('✅ Regular user already exists');
  }

  // Seed Projects (T208, T700, T207, T46)
  const existingProjects = await prisma.project.count();
  
  if (existingProjects === 0) {
    await prisma.project.createMany({
      data: [
        {
          projectNumber: 'T208',
          name: 'Sicherheitsupdate Q4',
          description: 'Update der Sicherheitssysteme und Protokolle',
          status: 'IN_PROGRESS',
          priority: 'URGENT',
          progress: 65,
          totalBudget: 75000,
          spentBudget: 48750,
          startDate: new Date('2025-09-01'),
          endDate: new Date('2025-12-31'),
          managerId: admin.id,
          createdBy: admin.id,
        },
        {
          projectNumber: 'T700',
          name: 'Komplett-Überholung 2025',
          description: 'Vollständige Überholung und Modernisierung',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          progress: 45,
          totalBudget: 200000,
          spentBudget: 90000,
          startDate: new Date('2025-01-15'),
          endDate: new Date('2025-06-30'),
          managerId: admin.id,
          createdBy: admin.id,
        },
        {
          projectNumber: 'T207',
          name: 'Digitalisierung Infrastruktur',
          description: 'Implementierung digitaler Wartungssysteme',
          status: 'PLANNED',
          priority: 'NORMAL',
          progress: 10,
          totalBudget: 150000,
          spentBudget: 5000,
          startDate: new Date('2025-11-01'),
          endDate: new Date('2026-03-31'),
          managerId: admin.id,
          createdBy: admin.id,
        },
        {
          projectNumber: 'T46',
          name: 'Energieeffizienz Optimierung',
          description: 'Verbesserung der Energieeffizienz der Anlagen',
          status: 'COMPLETED',
          priority: 'LOW',
          progress: 100,
          totalBudget: 50000,
          spentBudget: 47500,
          startDate: new Date('2025-04-01'),
          endDate: new Date('2025-08-31'),
          managerId: user!.id,
          createdBy: admin.id,
        },
      ],
    });

    console.log('✅ Created 4 projects: T208, T700, T207, T46');
  } else {
    console.log(`✅ Projects already exist (${existingProjects} projects found)`);
  }

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
