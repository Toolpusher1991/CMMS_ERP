import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findPhilip() {
  console.log('\n🔍 Suche nach User "Philip"...\n');
  
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { firstName: { contains: 'Philip' } },
        { lastName: { contains: 'Philip' } },
        { email: { contains: 'philip' } },
      ],
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      approvalStatus: true,
      isActive: true,
      assignedPlant: true,
      createdAt: true,
    },
  });

  if (users.length === 0) {
    console.log('❌ Kein User mit Namen "Philip" gefunden\n');
    console.log('💡 Tipp: Hat die Registration funktioniert?');
    console.log('   Überprüfe die Browser-Console auf Fehlermeldungen.\n');
  } else {
    console.log(`✅ ${users.length} User gefunden:\n`);
    users.forEach(u => {
      console.log(`📧 Email: ${u.email}`);
      console.log(`👤 Name: ${u.firstName} ${u.lastName}`);
      console.log(`🔐 Role: ${u.role}`);
      console.log(`📊 Status: ${u.approvalStatus}`);
      console.log(`✓ Active: ${u.isActive}`);
      console.log(`🏭 Plant: ${u.assignedPlant || 'Keine'}`);
      console.log(`📅 Erstellt: ${u.createdAt.toLocaleString('de-DE')}`);
      console.log(`🆔 ID: ${u.id}`);
      console.log('---');
    });
  }

  await prisma.$disconnect();
}

findPhilip().catch(console.error);
