import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function changeAdminPassword() {
  const newPassword = 'SecureAdmin2025!'; // Ändere dies zu deinem gewünschten Passwort
  
  try {
    // Hash das neue Passwort
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update Admin User
    const admin = await prisma.user.update({
      where: { email: 'admin@example.com' },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Admin-Passwort erfolgreich geändert!');
    console.log('📧 Email: admin@example.com');
    console.log('🔐 Neues Passwort:', newPassword);
    console.log('');
    console.log('⚠️  WICHTIG: Speichere dieses Passwort sicher!');
  } catch (error) {
    console.error('❌ Fehler beim Ändern des Passworts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

changeAdminPassword();
