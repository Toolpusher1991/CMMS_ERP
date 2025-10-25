import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * QR-Code Service für sichere mobile Authentifizierung
 * 
 * Sicherheitsfeatures:
 * - Kryptographisch sichere Token (32 Bytes Random)
 * - Keine Passwörter im QR-Code
 * - Token-Rotation bei Verlust möglich
 * - Audit-Logging für jeden QR-Login
 * - Optional: Expiration Time
 */

/**
 * Generiert einen sicheren QR-Token für einen User
 */
export async function generateQRToken(userId: string): Promise<string> {
  // Generiere kryptographisch sicheren Token (32 Bytes = 256 Bit)
  const token = crypto.randomBytes(32).toString('base64url'); // URL-safe Base64
  
  // Speichere Token in DB
  await prisma.user.update({
    where: { id: userId },
    data: {
      qrToken: token,
      qrTokenCreatedAt: new Date(),
      qrTokenExpiresAt: null, // Kein Ablauf (kann später aktiviert werden)
    },
  });
  
  return token;
}

/**
 * Generiert QR-Tokens für alle aktiven Rig Crew User
 */
export async function generateQRTokensForAllUsers(): Promise<void> {
  console.log('🔐 Generating secure QR tokens for all users...\n');
  
  try {
    // Hole alle aktiven USER (keine Admins)
    const users = await prisma.user.findMany({
      where: {
        role: 'USER',
        isActive: true,
        approvalStatus: 'APPROVED',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        assignedPlant: true,
      },
      orderBy: { email: 'asc' },
    });

    console.log(`📊 Found ${users.length} active users\n`);

    let successCount = 0;
    
    for (const user of users) {
      try {
        const token = await generateQRToken(user.id);
        console.log(`✅ ${user.email.padEnd(30)} → Token: ${token.substring(0, 20)}...`);
        successCount++;
      } catch (error) {
        console.error(`❌ ${user.email} → Error:`, error);
      }
    }

    console.log(`\n✅ Generated ${successCount}/${users.length} QR tokens`);
    console.log('\n📝 QR-Tokens können jetzt in QR-Codes umgewandelt werden');
    console.log('💡 Jeder Techniker bekommt seinen eigenen QR-Code zum Ausdrucken/Lasern');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Invalidiert einen QR-Token (bei Verlust des Schlüsselbunds)
 */
export async function revokeQRToken(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      qrToken: null,
      qrTokenCreatedAt: null,
      qrTokenExpiresAt: null,
    },
  });
}

/**
 * Validiert einen QR-Token und gibt User zurück
 */
export async function validateQRToken(token: string): Promise<any> {
  const user = await prisma.user.findUnique({
    where: { qrToken: token },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      assignedPlant: true,
      isActive: true,
      approvalStatus: true,
      qrTokenExpiresAt: true,
    },
  });

  if (!user) {
    throw new Error('Invalid QR token');
  }

  if (!user.isActive || user.approvalStatus !== 'APPROVED') {
    throw new Error('User account is not active');
  }

  // Check expiration (wenn gesetzt)
  if (user.qrTokenExpiresAt && user.qrTokenExpiresAt < new Date()) {
    throw new Error('QR token has expired');
  }

  // Update last used timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { qrTokenLastUsed: new Date() },
  });

  return user;
}

// Run if called directly
if (require.main === module) {
  generateQRTokensForAllUsers();
}
