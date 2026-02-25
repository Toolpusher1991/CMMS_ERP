/**
 * Migration: Update Rig contractStatus values
 * 
 * Maps old status values to new ones:
 *   idle      → stacked
 *   active    → operational
 *   standby   → stacked
 *   maintenance → overhaul
 *   (missing) → stacked
 * 
 * Run with: npx tsx backend/migrate-rig-status.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('🔄 Starting rig status migration...\n');

  // Map idle → stacked
  const idleResult = await prisma.rig.updateMany({
    where: { contractStatus: 'idle' },
    data: { contractStatus: 'stacked' }
  });
  console.log(`  idle → stacked: ${idleResult.count} rigs updated`);

  // Map active → operational
  const activeResult = await prisma.rig.updateMany({
    where: { contractStatus: 'active' },
    data: { contractStatus: 'operational' }
  });
  console.log(`  active → operational: ${activeResult.count} rigs updated`);

  // Map standby → stacked
  const standbyResult = await prisma.rig.updateMany({
    where: { contractStatus: 'standby' },
    data: { contractStatus: 'stacked' }
  });
  console.log(`  standby → stacked: ${standbyResult.count} rigs updated`);

  // Map maintenance → overhaul
  const maintenanceResult = await prisma.rig.updateMany({
    where: { contractStatus: 'maintenance' },
    data: { contractStatus: 'overhaul' }
  });
  console.log(`  maintenance → overhaul: ${maintenanceResult.count} rigs updated`);

  // Set default for any rigs without a valid status
  const invalidResult = await prisma.rig.updateMany({
    where: {
      NOT: {
        contractStatus: { in: ['stacked', 'operational', 'overhaul'] }
      }
    },
    data: { contractStatus: 'stacked' }
  });
  if (invalidResult.count > 0) {
    console.log(`  (invalid/missing) → stacked: ${invalidResult.count} rigs updated`);
  }

  const total = idleResult.count + activeResult.count + standbyResult.count + maintenanceResult.count + invalidResult.count;
  console.log(`\n✅ Migration complete. ${total} rigs updated in total.`);
}

migrate()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
