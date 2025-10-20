import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAdmin() {
  console.log('🔧 Fixing admin user approval status...');

  const result = await prisma.user.update({
    where: { email: 'admin@example.com' },
    data: {
      approvalStatus: 'APPROVED',
      isActive: true,
      approvedAt: new Date(),
    },
  });

  console.log('✅ Admin user updated:', {
    email: result.email,
    approvalStatus: result.approvalStatus,
    isActive: result.isActive,
  });
}

fixAdmin()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
