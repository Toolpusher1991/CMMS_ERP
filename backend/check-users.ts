import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('🔍 Checking all users in database...\n');

  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        firstName: true,
        lastName: true,
        assignedPlant: true,
        role: true,
        isActive: true,
        approvalStatus: true,
      },
      orderBy: [{ assignedPlant: 'asc' }, { email: 'asc' }],
    });

    console.log(`📊 Total users: ${users.length}\n`);

    // Group by plant
    const byPlant = users.reduce((acc, user) => {
      const plant = user.assignedPlant || 'No Plant';
      if (!acc[plant]) acc[plant] = [];
      acc[plant].push(user);
      return acc;
    }, {} as Record<string, typeof users>);

    for (const [plant, plantUsers] of Object.entries(byPlant)) {
      console.log(`\n🏭 ${plant} (${plantUsers.length} users):`);
      plantUsers.forEach((u) => {
        const status = u.isActive ? '✅' : '❌';
        const approval = u.approvalStatus === 'APPROVED' ? '✓' : u.approvalStatus;
        console.log(`   ${status} ${u.email.padEnd(30)} - ${u.firstName} ${u.lastName} [${u.role}] (${approval})`);
      });
    }

    // Check for specific user
    console.log('\n\n🔎 Checking specific login emails:');
    const testEmails = [
      'T208.EL@maintain.com',
      't208.el@maintain.com',
      'T208.el@maintain.com',
    ];

    for (const email of testEmails) {
      const user = await prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
        select: { email: true, firstName: true, lastName: true },
      });

      if (user) {
        console.log(`   ✅ "${email}" → Found: ${user.email} (${user.firstName} ${user.lastName})`);
      } else {
        console.log(`   ❌ "${email}" → NOT FOUND`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
