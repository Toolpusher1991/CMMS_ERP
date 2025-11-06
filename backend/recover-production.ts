import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function recoverProductionUsers() {
  console.log('🚨 PRODUCTION RECOVERY - Restoring users...');

  try {
    // Hash password
    const nilsPassword = await bcrypt.hash('Nils1234!', 10);
    const adminPassword = await bcrypt.hash('Admin2025!', 10);
    const managerPassword = await bcrypt.hash('Manager2025!', 10);

    // Create/Update Nils (ADMIN)
    const nils = await prisma.user.upsert({
      where: { email: 'nils@maintain.com' },
      update: {
        password: nilsPassword,
        role: 'ADMIN',
        isActive: true,
        approvalStatus: 'APPROVED',
      },
      create: {
        email: 'nils@maintain.com',
        password: nilsPassword,
        firstName: 'Nils',
        lastName: 'Werkmeister',
        role: 'ADMIN',
        assignedPlant: null, // Admin can access all plants
        isActive: true,
        approvalStatus: 'APPROVED',
      },
    });
    console.log('✅ Restored Nils:', nils.email);

    // Create Admin fallback
    const admin = await prisma.user.upsert({
      where: { email: 'admin@maintain.com' },
      update: {
        password: adminPassword,
        role: 'ADMIN',
        isActive: true,
        approvalStatus: 'APPROVED',
      },
      create: {
        email: 'admin@maintain.com',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        assignedPlant: null,
        isActive: true,
        approvalStatus: 'APPROVED',
      },
    });
    console.log('✅ Restored Admin:', admin.email);

    // Create Manager (Thomas)
    const manager = await prisma.user.upsert({
      where: { email: 'thomas@maintain.com' },
      update: {
        password: managerPassword,
        role: 'MANAGER',
        isActive: true,
        approvalStatus: 'APPROVED',
      },
      create: {
        email: 'thomas@maintain.com',
        password: managerPassword,
        firstName: 'Thomas',
        lastName: 'Manager',
        role: 'MANAGER',
        assignedPlant: null, // Managers can access all plants
        isActive: true,
        approvalStatus: 'APPROVED',
      },
    });
    console.log('✅ Restored Manager:', manager.email);

    // Create Projects (if missing)
    const plants = ['T208', 'T207', 'T700', 'T46'];
    for (const plant of plants) {
      const project = await prisma.project.upsert({
        where: { projectNumber: plant },
        update: {},
        create: {
          projectNumber: plant,
          name: `Project ${plant}`,
          plant: plant,
          status: 'ACTIVE',
          startDate: new Date(),
          creator: {
            connect: { email: 'nils@maintain.com' }
          }
        },
      });
      console.log(`✅ Restored Project: ${project.projectNumber}`);
    }

    console.log('\n🎉 RECOVERY COMPLETE!');
    console.log('\n📝 Login credentials:');
    console.log('Nils:    nils@maintain.com / Nils1234!');
    console.log('Admin:   admin@maintain.com / Admin2025!');
    console.log('Manager: thomas@maintain.com / Manager2025!');

  } catch (error) {
    console.error('❌ Recovery failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

recoverProductionUsers()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
