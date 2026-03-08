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
    // === Schwerlast (2000+ HP) ===
    { id: 't51',  name: 'T-51',  rigType: 'EMSCO C-3 III',       hp: 3000, year: 1980, category: 'Schwerlast',
      drawworks: 'Continental Emsco C-3 (3000 HP)', mudPumps: '3x Continental Emsco F-1600', topDrive: 'NOV TDS-11SA (750 ton)',
      dayRate: '45000', crewSize: '45-55', maxDepth: 8000, maxHookLoad: 1000, rotaryTorque: 105000, pumpPressure: 7500,
      derrickCapacity: '1500 t', mobilizationTime: '45-60 Tage', footprint: 'Groß' },
    { id: 't91',  name: 'T-91',  rigType: '2000 HP Stationary',   hp: 2000, year: 2014, category: 'Schwerlast',
      drawworks: 'Bentec EuroDW 2000', mudPumps: '2x Wirth TPK-1600', topDrive: 'Bentec TDS-500',
      dayRate: '38000', crewSize: '40-50', maxDepth: 7000, maxHookLoad: 700, rotaryTorque: 70000, pumpPressure: 7500,
      derrickCapacity: '1000 t', mobilizationTime: '30-45 Tage', footprint: 'Groß' },
    { id: 't92',  name: 'T-92',  rigType: '2000 HP Stationary',   hp: 2000, year: 2014, category: 'Schwerlast',
      drawworks: 'Bentec EuroDW 2000', mudPumps: '2x Wirth TPK-1600', topDrive: 'Bentec TDS-500',
      dayRate: '38000', crewSize: '40-50', maxDepth: 7000, maxHookLoad: 700, rotaryTorque: 70000, pumpPressure: 7500,
      derrickCapacity: '1000 t', mobilizationTime: '30-45 Tage', footprint: 'Groß' },
    { id: 't93',  name: 'T-93',  rigType: '2000 HP Stationary',   hp: 2000, year: 2015, category: 'Schwerlast',
      drawworks: 'NOV ADS-10T (2000 HP)', mudPumps: '2x NOV 14-P-220', topDrive: 'NOV TDS-11SA',
      dayRate: '39000', crewSize: '40-50', maxDepth: 7000, maxHookLoad: 700, rotaryTorque: 70000, pumpPressure: 7500,
      derrickCapacity: '1000 t', mobilizationTime: '30-45 Tage', footprint: 'Groß' },
    { id: 't94',  name: 'T-94',  rigType: '2000 HP Stationary',   hp: 2000, year: 2015, category: 'Schwerlast',
      drawworks: 'NOV ADS-10T (2000 HP)', mudPumps: '2x NOV 14-P-220', topDrive: 'NOV TDS-11SA',
      dayRate: '39000', crewSize: '40-50', maxDepth: 7000, maxHookLoad: 700, rotaryTorque: 70000, pumpPressure: 7500,
      derrickCapacity: '1000 t', mobilizationTime: '30-45 Tage', footprint: 'Groß' },
    { id: 't95',  name: 'T-95',  rigType: '2000 HP Stationary',   hp: 2000, year: 2015, category: 'Schwerlast',
      drawworks: 'NOV ADS-10T (2000 HP)', mudPumps: '2x NOV 14-P-220', topDrive: 'NOV TDS-11SA',
      dayRate: '39000', crewSize: '40-50', maxDepth: 7000, maxHookLoad: 700, rotaryTorque: 70000, pumpPressure: 7500,
      derrickCapacity: '1000 t', mobilizationTime: '30-45 Tage', footprint: 'Groß' },
    { id: 't867', name: 'T-867', rigType: '2000 HP Land Rig',     hp: 2000, year: 2014, category: 'Schwerlast',
      drawworks: 'National Oilwell 2000-UE', mudPumps: '2x Continental Emsco F-1600', topDrive: 'Canrig 1275E',
      dayRate: '35000', crewSize: '40-50', maxDepth: 7000, maxHookLoad: 680, rotaryTorque: 68000, pumpPressure: 7500,
      derrickCapacity: '950 t', mobilizationTime: '30-40 Tage', footprint: 'Groß' },
    { id: 't889', name: 'T-889', rigType: '2000 HP Land Rig',     hp: 2000, year: 2006, category: 'Schwerlast',
      drawworks: 'Continental Emsco C-2 (2000 HP)', mudPumps: '2x Wirth TPK-1600', topDrive: 'NOV TDS-8SA',
      dayRate: '33000', crewSize: '40-50', maxDepth: 6500, maxHookLoad: 650, rotaryTorque: 65000, pumpPressure: 7500,
      derrickCapacity: '900 t', mobilizationTime: '30-40 Tage', footprint: 'Groß' },

    // === Mittlere Leistung (1250-1500 HP) ===
    { id: 't144', name: 'T-144', rigType: '1250 HP Mobile',       hp: 1250, year: 2023, category: 'Mittlere Leistung',
      drawworks: 'Bentec EuroDW 1250', mudPumps: '2x Wirth TPK-1600', topDrive: 'Bentec TDS-250',
      dayRate: '25000', crewSize: '30-35', maxDepth: 5000, maxHookLoad: 500, rotaryTorque: 50000, pumpPressure: 5500,
      derrickCapacity: '625 t', mobilizationTime: '15-20 Tage', footprint: 'Mittel' },
    { id: 't145', name: 'T-145', rigType: '1250 HP Mobile',       hp: 1250, year: 2023, category: 'Mittlere Leistung',
      drawworks: 'Bentec EuroDW 1250', mudPumps: '2x Wirth TPK-1600', topDrive: 'Bentec TDS-250',
      dayRate: '25000', crewSize: '30-35', maxDepth: 5000, maxHookLoad: 500, rotaryTorque: 50000, pumpPressure: 5500,
      derrickCapacity: '625 t', mobilizationTime: '15-20 Tage', footprint: 'Mittel' },
    { id: 't146', name: 'T-146', rigType: '1250 HP Mobile',       hp: 1250, year: 2024, category: 'Mittlere Leistung',
      drawworks: 'NOV ADS-6T (1250 HP)', mudPumps: '2x NOV 14-P-160', topDrive: 'NOV TDS-4H',
      dayRate: '26000', crewSize: '30-35', maxDepth: 5000, maxHookLoad: 500, rotaryTorque: 50000, pumpPressure: 5500,
      derrickCapacity: '625 t', mobilizationTime: '15-20 Tage', footprint: 'Mittel' },
    { id: 't147', name: 'T-147', rigType: '1250 HP Mobile',       hp: 1250, year: 2024, category: 'Mittlere Leistung',
      drawworks: 'NOV ADS-6T (1250 HP)', mudPumps: '2x NOV 14-P-160', topDrive: 'NOV TDS-4H',
      dayRate: '26000', crewSize: '30-35', maxDepth: 5000, maxHookLoad: 500, rotaryTorque: 50000, pumpPressure: 5500,
      derrickCapacity: '625 t', mobilizationTime: '15-20 Tage', footprint: 'Mittel' },
    { id: 't849', name: 'T-849', rigType: '1500 HP Mobile',       hp: 1500, year: 2010, category: 'Mittlere Leistung',
      drawworks: 'National 1625-DE (1500 HP)', mudPumps: '2x Wirth TPK-1300', topDrive: 'Bentec TDS-250',
      dayRate: '28000', crewSize: '30-40', maxDepth: 5500, maxHookLoad: 550, rotaryTorque: 55000, pumpPressure: 6000,
      derrickCapacity: '750 t', mobilizationTime: '20-25 Tage', footprint: 'Mittel' },
    { id: 't858', name: 'T-858', rigType: '1500 HP Mobile',       hp: 1500, year: 2010, category: 'Mittlere Leistung',
      drawworks: 'Bentec EuroDW 1500', mudPumps: '2x Continental Emsco F-1300', topDrive: 'NOV TDS-4S',
      dayRate: '28000', crewSize: '30-40', maxDepth: 5500, maxHookLoad: 550, rotaryTorque: 55000, pumpPressure: 6000,
      derrickCapacity: '750 t', mobilizationTime: '20-25 Tage', footprint: 'Mittel' },
    { id: 't859', name: 'T-859', rigType: '1500 HP Mobile',       hp: 1500, year: 2010, category: 'Mittlere Leistung',
      drawworks: 'NOV ADS-7T (1500 HP)', mudPumps: '2x NOV 14-P-160', topDrive: 'Canrig 8050E',
      dayRate: '28000', crewSize: '30-40', maxDepth: 5500, maxHookLoad: 550, rotaryTorque: 55000, pumpPressure: 6000,
      derrickCapacity: '750 t', mobilizationTime: '20-25 Tage', footprint: 'Mittel' },

    // === Kompakt 1000 HP ===
    { id: 't895', name: 'T-895', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt',
      drawworks: 'Bentec EuroDW 1000', mudPumps: '2x Wirth TPK-800', topDrive: 'Canrig 7005',
      dayRate: '18000', crewSize: '22-28', maxDepth: 3500, maxHookLoad: 350, rotaryTorque: 35000, pumpPressure: 5000,
      derrickCapacity: '500 t', mobilizationTime: '10-15 Tage', footprint: 'Klein' },
    { id: 't896', name: 'T-896', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt',
      drawworks: 'Bentec EuroDW 1000', mudPumps: '2x Wirth TPK-800', topDrive: 'Canrig 7005',
      dayRate: '18000', crewSize: '22-28', maxDepth: 3500, maxHookLoad: 350, rotaryTorque: 35000, pumpPressure: 5000,
      derrickCapacity: '500 t', mobilizationTime: '10-15 Tage', footprint: 'Klein' },
    { id: 't897', name: 'T-897', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt',
      drawworks: 'Bentec EuroDW 1000', mudPumps: '2x Continental Emsco F-800', topDrive: 'NOV TDS-3H',
      dayRate: '18000', crewSize: '22-28', maxDepth: 3500, maxHookLoad: 350, rotaryTorque: 35000, pumpPressure: 5000,
      derrickCapacity: '500 t', mobilizationTime: '10-15 Tage', footprint: 'Klein' },
    { id: 't898', name: 'T-898', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt',
      drawworks: 'Bentec EuroDW 1000', mudPumps: '2x Continental Emsco F-800', topDrive: 'NOV TDS-3H',
      dayRate: '18000', crewSize: '22-28', maxDepth: 3500, maxHookLoad: 350, rotaryTorque: 35000, pumpPressure: 5000,
      derrickCapacity: '500 t', mobilizationTime: '10-15 Tage', footprint: 'Klein' },
    { id: 't899', name: 'T-899', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt',
      drawworks: 'Bentec EuroDW 1000', mudPumps: '2x Wirth TPK-800', topDrive: 'Bentec TDS-150',
      dayRate: '18000', crewSize: '22-28', maxDepth: 3500, maxHookLoad: 350, rotaryTorque: 35000, pumpPressure: 5000,
      derrickCapacity: '500 t', mobilizationTime: '10-15 Tage', footprint: 'Klein' },

    // === Kompakt 800 HP ===
    { id: 't801', name: 'T-801', rigType: '800 HP Highly Mobile',  hp: 800,  year: 1992, category: 'Kompakt',
      drawworks: 'Ideco H-44 (800 HP)', mudPumps: '1x Continental Emsco F-800', topDrive: 'NOV TDS-3H',
      dayRate: '14000', crewSize: '20-25', maxDepth: 3000, maxHookLoad: 280, rotaryTorque: 28000, pumpPressure: 4500,
      derrickCapacity: '400 t', mobilizationTime: '7-12 Tage', footprint: 'Klein' },
    { id: 't826', name: 'T-826', rigType: '800 HP CARDWELL',      hp: 800,  year: 1988, category: 'Kompakt',
      drawworks: 'Cardwell KB-660 (800 HP)', mudPumps: '1x Wirth TPK-800', topDrive: 'NOV TDS-3H',
      dayRate: '13000', crewSize: '20-25', maxDepth: 3000, maxHookLoad: 270, rotaryTorque: 27000, pumpPressure: 4500,
      derrickCapacity: '380 t', mobilizationTime: '7-10 Tage', footprint: 'Klein' },
    { id: 't853', name: 'T-853', rigType: '800 HP Highly Mobile',  hp: 800,  year: 1995, category: 'Kompakt',
      drawworks: 'National 80B (800 HP)', mudPumps: '1x Continental Emsco F-800', topDrive: 'Bentec TDS-150',
      dayRate: '14000', crewSize: '20-25', maxDepth: 3000, maxHookLoad: 280, rotaryTorque: 28000, pumpPressure: 4500,
      derrickCapacity: '400 t', mobilizationTime: '7-12 Tage', footprint: 'Klein' },
    { id: 't872', name: 'T-872', rigType: '800 HP Highly Mobile',  hp: 800,  year: 1992, category: 'Kompakt',
      drawworks: 'Ideco H-44 (800 HP)', mudPumps: '1x Wirth TPK-800', topDrive: 'Canrig 7005',
      dayRate: '14000', crewSize: '20-25', maxDepth: 3000, maxHookLoad: 280, rotaryTorque: 28000, pumpPressure: 4500,
      derrickCapacity: '400 t', mobilizationTime: '7-12 Tage', footprint: 'Klein' },
  ];

  await prisma.rig.createMany({
    data: rigFleet.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      maxDepth: r.maxDepth,
      maxHookLoad: r.maxHookLoad,
      footprint: r.footprint,
      rotaryTorque: r.rotaryTorque,
      pumpPressure: r.pumpPressure,
      drawworks: r.drawworks,
      mudPumps: r.mudPumps,
      topDrive: r.topDrive,
      derrickCapacity: r.derrickCapacity,
      crewSize: r.crewSize,
      mobilizationTime: r.mobilizationTime,
      dayRate: r.dayRate,
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
