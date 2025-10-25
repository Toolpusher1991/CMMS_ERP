import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Generiert QR-Code Images für alle User oder einen spezifischen User
 */
async function generateQRCodeImages(email?: string) {
  console.log('🎨 Generating QR-Code images...\n');

  try {
    // Hole User
    const users = email
      ? [await prisma.user.findUnique({ where: { email } })]
      : await prisma.user.findMany({
          where: {
            role: 'USER',
            isActive: true,
            approvalStatus: 'APPROVED',
            qrToken: { not: null },
          },
          orderBy: { email: 'asc' },
        });

    const validUsers = users.filter((u) => u !== null);

    if (validUsers.length === 0) {
      console.log('❌ No users found with QR tokens');
      return;
    }

    // Output Ordner erstellen
    const outputDir = path.join(__dirname, '../../qr-codes');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`📊 Found ${validUsers.length} users\n`);

    for (const user of validUsers) {
      if (!user.qrToken) continue;

      try {
        // Dateiname: QR_T208_EL.png
        const fileName = `QR_${user.email.replace('@', '_').replace(/\./g, '_')}.png`;
        const filePath = path.join(outputDir, fileName);

        // QR-Code generieren (400x400px, hohe Fehlerkorrektur)
        await QRCode.toFile(filePath, user.qrToken, {
          width: 400,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        console.log(`✅ ${user.email.padEnd(30)} → ${fileName}`);
      } catch (error) {
        console.error(`❌ ${user.email} → Error:`, error);
      }
    }

    console.log(`\n✅ Generated ${validUsers.length} QR-Code images`);
    console.log(`📁 Location: ${outputDir}`);
    console.log('\n💡 Diese QR-Codes können jetzt ausgedruckt oder am Bildschirm angezeigt werden');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// CLI Argument: email (optional)
const email = process.argv[2];

generateQRCodeImages(email);
