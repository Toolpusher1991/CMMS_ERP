import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simplifyLogins() {
  console.log('🔄 Simplifying login emails to new format...\n');

  // Mapping: old email -> new email
  const emailMapping = [
    // T208
    { old: 'elektriker.t208@rigcrew.com', new: 'T208.EL@maintain.com' },
    { old: 'mechaniker.t208@rigcrew.com', new: 'T208.ME@maintain.com' },
    { old: 'toolpusher.t208@rigcrew.com', new: 'T208.TP@maintain.com' },
    { old: 'rigmanager.t208@rigcrew.com', new: 'T208.RM@maintain.com' },
    { old: 'supply.t208@rigcrew.com', new: 'T208.RSC@maintain.com' },
    
    // T207
    { old: 'elektriker.t207@rigcrew.com', new: 'T207.EL@maintain.com' },
    { old: 'mechaniker.t207@rigcrew.com', new: 'T207.ME@maintain.com' },
    { old: 'toolpusher.t207@rigcrew.com', new: 'T207.TP@maintain.com' },
    { old: 'rigmanager.t207@rigcrew.com', new: 'T207.RM@maintain.com' },
    { old: 'supply.t207@rigcrew.com', new: 'T207.RSC@maintain.com' },
    
    // T700
    { old: 'elektriker.t700@rigcrew.com', new: 'T700.EL@maintain.com' },
    { old: 'mechaniker.t700@rigcrew.com', new: 'T700.ME@maintain.com' },
    { old: 'toolpusher.t700@rigcrew.com', new: 'T700.TP@maintain.com' },
    { old: 'rigmanager.t700@rigcrew.com', new: 'T700.RM@maintain.com' },
    { old: 'supply.t700@rigcrew.com', new: 'T700.RSC@maintain.com' },
    
    // T46
    { old: 'elektriker.t46@rigcrew.com', new: 'T46.EL@maintain.com' },
    { old: 'mechaniker.t46@rigcrew.com', new: 'T46.ME@maintain.com' },
    { old: 'toolpusher.t46@rigcrew.com', new: 'T46.TP@maintain.com' },
    { old: 'rigmanager.t46@rigcrew.com', new: 'T46.RM@maintain.com' },
    { old: 'supply.t46@rigcrew.com', new: 'T46.RSC@maintain.com' },
  ];

  try {
    let successCount = 0;
    let notFoundCount = 0;

    for (const mapping of emailMapping) {
      try {
        const result = await prisma.user.updateMany({
          where: { email: mapping.old },
          data: { email: mapping.new },
        });

        if (result.count > 0) {
          console.log(`✅ ${mapping.old.padEnd(35)} → ${mapping.new}`);
          successCount++;
        } else {
          console.log(`⚠️  ${mapping.old.padEnd(35)} → Not found`);
          notFoundCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating ${mapping.old}:`, error);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${successCount}`);
    console.log(`   ⚠️  Not found: ${notFoundCount}`);

    // Verify
    console.log('\n📋 Verification - All @maintain.com users:');
    const maintainUsers = await prisma.user.findMany({
      where: { email: { contains: '@maintain.com' } },
      select: { email: true, firstName: true, lastName: true, assignedPlant: true, role: true },
      orderBy: [{ assignedPlant: 'asc' }, { email: 'asc' }],
    });

    maintainUsers.forEach((user) => {
      console.log(`   ${user.email.padEnd(25)} - ${user.firstName} ${user.lastName} (${user.assignedPlant}) [${user.role}]`);
    });

  } catch (error) {
    console.error('❌ Error simplifying logins:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simplifyLogins();
