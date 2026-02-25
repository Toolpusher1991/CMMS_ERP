import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixEmail() {
  try {
    const updated = await prisma.user.update({
      where: { email: 'Philip@rigcrew.com' },
      data: { email: 'philip@rigcrew.com' }
    });
    
    console.log('✅ Email erfolgreich geändert:');
    console.log(`   Alt: Philip@rigcrew.com`);
    console.log(`   Neu: ${updated.email}`);
  } catch (error: unknown) {
    console.error('❌ Fehler:', error instanceof Error ? error.message : error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEmail();
