import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makePhilipAdmin() {
  try {
    const updated = await prisma.user.update({
      where: { email: 'philip@rigcrew.com' },
      data: { role: 'ADMIN' }
    });
    
    console.log('✅ Philip ist jetzt Admin!');
    console.log(`   📧 Email: ${updated.email}`);
    console.log(`   👤 Name: ${updated.firstName} ${updated.lastName}`);
    console.log(`   🔐 Rolle: ${updated.role}`);
  } catch (error: unknown) {
    console.error('❌ Fehler:', error instanceof Error ? error.message : error);
  } finally {
    await prisma.$disconnect();
  }
}

makePhilipAdmin();
