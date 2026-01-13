import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetNilsPassword() {
  try {
    const newPassword = 'nils123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
      where: { email: 'nils@maintain.com' },
      data: {
        password: hashedPassword,
        isActive: true,
        approvalStatus: 'APPROVED',
        loginAttempts: 0,
        lockedUntil: null,
      },
    });

    console.log('✅ Password reset successful!');
    console.log('\n📧 Email: nils@maintain.com');
    console.log('🔑 Password: nils123');
    console.log(`👤 Name: ${user.firstName} ${user.lastName}`);
    console.log(`🎯 Role: ${user.role}`);
    console.log(`✓ Status: ${user.isActive ? 'Active' : 'Inactive'} | ${user.approvalStatus}`);

  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetNilsPassword();
