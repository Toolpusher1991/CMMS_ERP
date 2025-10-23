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
  } catch (error: any) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

makePhilipAdmin();
