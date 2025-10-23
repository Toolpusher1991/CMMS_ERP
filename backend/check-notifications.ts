import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNotifications() {
  console.log('=== CHECKING MANAGERS ===');
  const managers = await prisma.user.findMany({
    where: {
      role: 'MANAGER',
      isActive: true,
      approvalStatus: 'APPROVED',
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  console.log(`Found ${managers.length} active managers:`);
  managers.forEach(m => {
    console.log(`  - ${m.firstName} ${m.lastName} (${m.email}) - ID: ${m.id}`);
  });

  console.log('\n=== CHECKING ALL USERS ===');
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      approvalStatus: true,
    },
  });

  console.log(`Total users: ${allUsers.length}`);
  allUsers.forEach(u => {
    console.log(`  ${u.firstName} ${u.lastName} (${u.email}) - Role: ${u.role}, Active: ${u.isActive}, Status: ${u.approvalStatus}`);
  });

  console.log('\n=== CHECKING NOTIFICATIONS ===');
  const notifications = await prisma.notification.findMany({
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log(`Found ${notifications.length} recent notifications:`);
  notifications.forEach(n => {
    console.log(`  - [${n.isRead ? 'READ' : 'UNREAD'}] ${n.type}: ${n.title}`);
    console.log(`    For: ${n.user.firstName} ${n.user.lastName} (${n.user.email})`);
    console.log(`    Created: ${n.createdAt}`);
  });

  await prisma.$disconnect();
}

checkNotifications().catch(console.error);
