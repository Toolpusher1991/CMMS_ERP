import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUsersPlant() {
  console.log('🔄 Updating user plant assignments...\n');

  const rigs = ['T208', 'T207', 'T700', 'T46'];
  let updatedCount = 0;

  for (const rig of rigs) {
    // Update alle User die zu diesem Rig gehören
    const result = await prisma.user.updateMany({
      where: {
        email: {
          contains: `.${rig.toLowerCase()}@rigcrew.com`,
        },
      },
      data: {
        assignedPlant: rig,
      },
    });

    console.log(`✅ Updated ${result.count} users for ${rig}`);
    updatedCount += result.count;
  }

  console.log(`\n🎉 Total: ${updatedCount} users updated with plant assignments!`);
  
  // Zeige ein paar Beispiel-User
  const sampleUsers = await prisma.user.findMany({
    where: {
      assignedPlant: { not: null },
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      assignedPlant: true,
    },
    take: 5,
  });

  console.log('\n📋 Sample users with plant assignments:');
  sampleUsers.forEach(user => {
    console.log(`  ${user.email} → ${user.assignedPlant} (${user.firstName} ${user.lastName})`);
  });
}

updateUsersPlant()
  .catch((e) => {
    console.error('❌ Error updating users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
