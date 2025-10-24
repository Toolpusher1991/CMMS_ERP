import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Sichere aber merkbare Passwörter: Anlage + Position + Jahr
const passwordMap: { [email: string]: string } = {
  // Admin bleibt wie vom User geändert
  'user@example.com': 'TestUser2025!',
  
  // T208 Crew
  'elektriker.t208@rigcrew.com': 'T208Elektriker!',
  'mechaniker.t208@rigcrew.com': 'T208Mechaniker!',
  'toolpusher.t208@rigcrew.com': 'T208Toolpusher!',
  'rigmanager.t208@rigcrew.com': 'T208Manager!',
  'supply.t208@rigcrew.com': 'T208Supply!',
  
  // T207 Crew
  'elektriker.t207@rigcrew.com': 'T207Elektriker!',
  'mechaniker.t207@rigcrew.com': 'T207Mechaniker!',
  'toolpusher.t207@rigcrew.com': 'T207Toolpusher!',
  'rigmanager.t207@rigcrew.com': 'T207Manager!',
  'supply.t207@rigcrew.com': 'T207Supply!',
  
  // T700 Crew
  'elektriker.t700@rigcrew.com': 'T700Elektriker!',
  'mechaniker.t700@rigcrew.com': 'T700Mechaniker!',
  'toolpusher.t700@rigcrew.com': 'T700Toolpusher!',
  'rigmanager.t700@rigcrew.com': 'T700Manager!',
  'supply.t700@rigcrew.com': 'T700Supply!',
  
  // T46 Crew
  'elektriker.t46@rigcrew.com': 'T46Elektriker!',
  'mechaniker.t46@rigcrew.com': 'T46Mechaniker!',
  'toolpusher.t46@rigcrew.com': 'T46Toolpusher!',
  'rigmanager.t46@rigcrew.com': 'T46Manager!',
  'supply.t46@rigcrew.com': 'T46Supply!',
};

async function updatePasswords() {
  console.log('🔐 Aktualisiere Passwörter für alle User...\n');
  
  let updated = 0;
  let skipped = 0;
  
  for (const [email, password] of Object.entries(passwordMap)) {
    try {
      // Hash das Passwort
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Update User
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      
      console.log(`✅ ${email} → ${password}`);
      updated++;
    } catch (error: any) {
      if (error.code === 'P2025') {
        console.log(`⚠️  ${email} nicht gefunden, übersprungen`);
        skipped++;
      } else {
        console.error(`❌ Fehler bei ${email}:`, error.message);
      }
    }
  }
  
  console.log(`\n📊 Zusammenfassung:`);
  console.log(`   ✅ Aktualisiert: ${updated}`);
  console.log(`   ⚠️  Übersprungen: ${skipped}`);
  console.log(`\n⚠️  WICHTIG: Admin-Passwort wurde NICHT geändert (bereits vom User gesetzt)`);
  
  await prisma.$disconnect();
}

updatePasswords();
