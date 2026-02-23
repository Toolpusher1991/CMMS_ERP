/**
 * Startup Fleet Sync
 * 
 * Runs once at backend startup. Checks if the database still has old rigs
 * (T700, T46, T203, T208, T207, T92) and replaces them with the
 * Equipment Master Database fleet (24 rigs, all Oman).
 * 
 * This is idempotent — if the new fleet is already present, it does nothing.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OLD_RIG_NAMES = ['T700', 'T46', 'T203', 'T208', 'T207', 'T92', 'T350'];

const RIG_FLEET = [
  { id: 't51',  name: 'T-51',  rigType: 'EMSCO C-3 III',       hp: 3000, year: 1980, category: 'Schwerlast' },
  { id: 't91',  name: 'T-91',  rigType: '2000 HP Stationary',   hp: 2000, year: 2014, category: 'Schwerlast' },
  { id: 't92',  name: 'T-92',  rigType: '2000 HP Stationary',   hp: 2000, year: 2014, category: 'Schwerlast' },
  { id: 't93',  name: 'T-93',  rigType: '2000 HP Stationary',   hp: 2000, year: 2015, category: 'Schwerlast' },
  { id: 't94',  name: 'T-94',  rigType: '2000 HP Stationary',   hp: 2000, year: 2015, category: 'Schwerlast' },
  { id: 't95',  name: 'T-95',  rigType: '2000 HP Stationary',   hp: 2000, year: 2015, category: 'Schwerlast' },
  { id: 't144', name: 'T-144', rigType: '1250 HP Mobile',       hp: 1250, year: 2023, category: 'Mittlere Leistung' },
  { id: 't145', name: 'T-145', rigType: '1250 HP Mobile',       hp: 1250, year: 2023, category: 'Mittlere Leistung' },
  { id: 't146', name: 'T-146', rigType: '1250 HP Mobile',       hp: 1250, year: 2024, category: 'Mittlere Leistung' },
  { id: 't147', name: 'T-147', rigType: '1250 HP Mobile',       hp: 1250, year: 2024, category: 'Mittlere Leistung' },
  { id: 't801', name: 'T-801', rigType: '800 HP Highly Mobile',  hp: 800,  year: 1992, category: 'Kompakt' },
  { id: 't826', name: 'T-826', rigType: '800 HP CARDWELL',      hp: 800,  year: 1988, category: 'Kompakt' },
  { id: 't849', name: 'T-849', rigType: '1500 HP Mobile',       hp: 1500, year: 2010, category: 'Mittlere Leistung' },
  { id: 't853', name: 'T-853', rigType: '800 HP Highly Mobile',  hp: 800,  year: 1995, category: 'Kompakt' },
  { id: 't858', name: 'T-858', rigType: '1500 HP Mobile',       hp: 1500, year: 2010, category: 'Mittlere Leistung' },
  { id: 't859', name: 'T-859', rigType: '1500 HP Mobile',       hp: 1500, year: 2010, category: 'Mittlere Leistung' },
  { id: 't867', name: 'T-867', rigType: '2000 HP Land Rig',     hp: 2000, year: 2014, category: 'Schwerlast' },
  { id: 't872', name: 'T-872', rigType: '800 HP Highly Mobile',  hp: 800,  year: 1992, category: 'Kompakt' },
  { id: 't889', name: 'T-889', rigType: '2000 HP Land Rig',     hp: 2000, year: 2006, category: 'Schwerlast' },
  { id: 't895', name: 'T-895', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt' },
  { id: 't896', name: 'T-896', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt' },
  { id: 't897', name: 'T-897', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt' },
  { id: 't898', name: 'T-898', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt' },
  { id: 't899', name: 'T-899', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt' },
];

export async function syncFleetOnStartup(): Promise<void> {
  try {
    // Check if any old rigs still exist
    const oldRigs = await prisma.rig.findMany({
      where: { name: { in: OLD_RIG_NAMES } },
      select: { id: true, name: true },
    });

    // Also check if new fleet is already present
    const newRigCount = await prisma.rig.count({
      where: { name: { startsWith: 'T-' } },
    });

    if (oldRigs.length === 0 && newRigCount >= 24) {
      console.log('✅ Fleet sync: Equipment Master Database fleet already present');
      return;
    }

    console.log(`🔧 Fleet sync: Found ${oldRigs.length} old rigs, ${newRigCount} new rigs — performing reset...`);

    // 1. Unlink foreign keys
    await prisma.action.updateMany({ where: { rigId: { not: null } }, data: { rigId: null } });
    await prisma.project.updateMany({ where: { rigId: { not: null } }, data: { rigId: null } });
    await prisma.failureReport.updateMany({ where: { rigId: { not: null } }, data: { rigId: null } });

    // 2. Delete ALL existing rigs
    const deleted = await prisma.rig.deleteMany({});
    console.log(`   → Deleted ${deleted.count} old rigs`);

    // 3. Create new fleet
    await prisma.rig.createMany({
      data: RIG_FLEET.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        maxDepth: r.hp >= 2000 ? 7000 : r.hp >= 1250 ? 5000 : 3000,
        maxHookLoad: Math.round(r.hp * 0.35),
        footprint: r.hp >= 2000 ? 'Groß' : r.hp >= 1250 ? 'Mittel' : 'Klein',
        rotaryTorque: r.hp * 35,
        pumpPressure: r.hp >= 2000 ? 7500 : r.hp >= 1250 ? 5500 : 4500,
        drawworks: `${r.hp} HP`,
        mudPumps: r.hp >= 2000 ? '2x Triplex' : '1x Triplex',
        topDrive: r.hp >= 2000 ? '1000 HP' : r.hp >= 1250 ? '500 HP' : '350 HP',
        derrickCapacity: `${Math.round(r.hp * 0.5)} t`,
        crewSize: r.hp >= 2000 ? '40-50' : r.hp >= 1250 ? '30-35' : '20-25',
        mobilizationTime: r.hp >= 2000 ? '30-45 Tage' : r.hp >= 1250 ? '15-20 Tage' : '7-12 Tage',
        dayRate: '0',
        description: `${r.rigType} Drilling Rig (${r.year})`,
        applications: JSON.stringify([]),
        technicalSpecs: JSON.stringify({ rigType: r.rigType, hpRating: `${r.hp} HP`, year: r.year }),
        region: 'Oman',
        contractStatus: 'idle',
        location: '',
        certifications: JSON.stringify([]),
        generalInfo: JSON.stringify([]),
        inspections: JSON.stringify([]),
        issues: JSON.stringify([]),
        improvements: JSON.stringify([]),
      })),
    });

    console.log(`   ✅ Fleet sync complete: ${RIG_FLEET.length} rigs created (all Oman)`);
  } catch (error) {
    console.error('⚠️ Fleet sync failed (non-fatal):', error);
    // Non-fatal — server continues even if fleet sync fails
  } finally {
    await prisma.$disconnect();
  }
}
