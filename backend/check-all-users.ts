import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllUsers() {
  console.log('🔍 Checking all users in database...\n');

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        approvalStatus: true,
        assignedPlant: true,
      },
      orderBy: { email: 'asc' },
    });

    console.log(`📊 Total users: ${users.length}\n`);

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      return;
    }

    users.forEach((user) => {
      const status = user.isActive ? '✅ Active' : '❌ Inactive';
      const approval = user.approvalStatus === 'APPROVED' ? '✓ Approved' : user.approvalStatus;
      console.log(`\n📧 ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${status} | ${approval}`);
      console.log(`   Plant: ${user.assignedPlant || 'None'}`);
      console.log(`   ID: ${user.id}`);
    });

    // Search for Nils specifically
    const nilsUsers = users.filter(u => 
      u.email.toLowerCase().includes('nils') || 
      u.firstName?.toLowerCase().includes('nils') ||
      u.lastName?.toLowerCase().includes('nils')
    );

    if (nilsUsers.length > 0) {
      console.log('\n\n🎯 Users with "Nils" found:');
      nilsUsers.forEach(u => console.log(`   - ${u.email} (${u.firstName} ${u.lastName})`));
    } else {
      console.log('\n\n❌ No users with "Nils" found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllUsers();
