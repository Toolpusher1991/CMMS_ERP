/**
 * Reset Rigs Script
 * 
 * Dieses Script entfernt alle bestehenden Rigs aus der Datenbank
 * und erstellt die 24 neuen Anlagen aus dem Equipment Master Database.
 * 
 * Ausführung auf Render Shell:
 *   npx tsx reset-rigs.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Reset Rigs — Equipment Master Database Fleet');
  console.log('================================================\n');

  // 1. Unlink all actions, projects, failure reports from rigs
  console.log('1️⃣  Unlinking actions from rigs...');
  const unlinkActions = await prisma.action.updateMany({
    where: { rigId: { not: null } },
    data: { rigId: null },
  });
  console.log(`   → ${unlinkActions.count} actions unlinked`);

  console.log('2️⃣  Unlinking projects from rigs...');
  const unlinkProjects = await prisma.project.updateMany({
    where: { rigId: { not: null } },
    data: { rigId: null },
  });
  console.log(`   → ${unlinkProjects.count} projects unlinked`);

  console.log('3️⃣  Unlinking failure reports from rigs...');
  const unlinkReports = await prisma.failureReport.updateMany({
    where: { rigId: { not: null } },
    data: { rigId: null },
  });
  console.log(`   → ${unlinkReports.count} failure reports unlinked`);

  // 2. Delete all existing rigs
  console.log('\n4️⃣  Deleting all existing rigs...');
  const deleted = await prisma.rig.deleteMany({});
  console.log(`   → ${deleted.count} rigs deleted`);

  // 3. Create new fleet
  console.log('\n5️⃣  Creating Equipment Master Database fleet...\n');

  const rigFleet = [
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

  await prisma.rig.createMany({
    data: rigFleet.map(r => ({
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

  for (const r of rigFleet) {
    console.log(`   ✅ ${r.name} — ${r.rigType} (${r.hp} HP, ${r.year})`);
  }

  console.log(`\n🎉 Done! ${rigFleet.length} rigs created. All set to region: Oman`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
