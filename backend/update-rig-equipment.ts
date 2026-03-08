/**
 * Update Rig Equipment Data
 * 
 * Updates all existing rigs with realistic manufacturer names for:
 * - Drawworks (Emsco, Bentec, NOV, National, Ideco, Cardwell)
 * - Mud Pumps (Wirth TPK, Continental Emsco F, NOV 14-P)
 * - Top Drive (Bentec TDS, NOV TDS, Canrig)
 * - Day Rates, Crew Sizes, Max Depth, Hook Load, etc.
 * 
 * Ausführung:
 *   npx tsx update-rig-equipment.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RigUpdate {
  name: string;
  drawworks: string;
  mudPumps: string;
  topDrive: string;
  dayRate: string;
  crewSize: string;
  maxDepth: number;
  maxHookLoad: number;
  rotaryTorque: number;
  pumpPressure: number;
  derrickCapacity: string;
  mobilizationTime: string;
  footprint: string;
}

const rigUpdates: RigUpdate[] = [
  // === Schwerlast (2000+ HP) ===
  { name: 'T-51',  drawworks: 'Continental Emsco C-3 (3000 HP)', mudPumps: '3x Continental Emsco F-1600', topDrive: 'NOV TDS-11SA (750 ton)',
    dayRate: '45000', crewSize: '45-55', maxDepth: 8000, maxHookLoad: 1000, rotaryTorque: 105000, pumpPressure: 7500,
    derrickCapacity: '1500 t', mobilizationTime: '45-60 Tage', footprint: 'Groß' },
  { name: 'T-91',  drawworks: 'Bentec EuroDW 2000', mudPumps: '2x Wirth TPK-1600', topDrive: 'Bentec TDS-500',
    dayRate: '38000', crewSize: '40-50', maxDepth: 7000, maxHookLoad: 700, rotaryTorque: 70000, pumpPressure: 7500,
    derrickCapacity: '1000 t', mobilizationTime: '30-45 Tage', footprint: 'Groß' },
  { name: 'T-92',  drawworks: 'Bentec EuroDW 2000', mudPumps: '2x Wirth TPK-1600', topDrive: 'Bentec TDS-500',
    dayRate: '38000', crewSize: '40-50', maxDepth: 7000, maxHookLoad: 700, rotaryTorque: 70000, pumpPressure: 7500,
    derrickCapacity: '1000 t', mobilizationTime: '30-45 Tage', footprint: 'Groß' },
  { name: 'T-93',  drawworks: 'NOV ADS-10T (2000 HP)', mudPumps: '2x NOV 14-P-220', topDrive: 'NOV TDS-11SA',
    dayRate: '39000', crewSize: '40-50', maxDepth: 7000, maxHookLoad: 700, rotaryTorque: 70000, pumpPressure: 7500,
    derrickCapacity: '1000 t', mobilizationTime: '30-45 Tage', footprint: 'Groß' },
  { name: 'T-94',  drawworks: 'NOV ADS-10T (2000 HP)', mudPumps: '2x NOV 14-P-220', topDrive: 'NOV TDS-11SA',
    dayRate: '39000', crewSize: '40-50', maxDepth: 7000, maxHookLoad: 700, rotaryTorque: 70000, pumpPressure: 7500,
    derrickCapacity: '1000 t', mobilizationTime: '30-45 Tage', footprint: 'Groß' },
  { name: 'T-95',  drawworks: 'NOV ADS-10T (2000 HP)', mudPumps: '2x NOV 14-P-220', topDrive: 'NOV TDS-11SA',
    dayRate: '39000', crewSize: '40-50', maxDepth: 7000, maxHookLoad: 700, rotaryTorque: 70000, pumpPressure: 7500,
    derrickCapacity: '1000 t', mobilizationTime: '30-45 Tage', footprint: 'Groß' },
  { name: 'T-867', drawworks: 'National Oilwell 2000-UE', mudPumps: '2x Continental Emsco F-1600', topDrive: 'Canrig 1275E',
    dayRate: '35000', crewSize: '40-50', maxDepth: 7000, maxHookLoad: 680, rotaryTorque: 68000, pumpPressure: 7500,
    derrickCapacity: '950 t', mobilizationTime: '30-40 Tage', footprint: 'Groß' },
  { name: 'T-889', drawworks: 'Continental Emsco C-2 (2000 HP)', mudPumps: '2x Wirth TPK-1600', topDrive: 'NOV TDS-8SA',
    dayRate: '33000', crewSize: '40-50', maxDepth: 6500, maxHookLoad: 650, rotaryTorque: 65000, pumpPressure: 7500,
    derrickCapacity: '900 t', mobilizationTime: '30-40 Tage', footprint: 'Groß' },

  // === Mittlere Leistung (1250-1500 HP) ===
  { name: 'T-144', drawworks: 'Bentec EuroDW 1250', mudPumps: '2x Wirth TPK-1600', topDrive: 'Bentec TDS-250',
    dayRate: '25000', crewSize: '30-35', maxDepth: 5000, maxHookLoad: 500, rotaryTorque: 50000, pumpPressure: 5500,
    derrickCapacity: '625 t', mobilizationTime: '15-20 Tage', footprint: 'Mittel' },
  { name: 'T-145', drawworks: 'Bentec EuroDW 1250', mudPumps: '2x Wirth TPK-1600', topDrive: 'Bentec TDS-250',
    dayRate: '25000', crewSize: '30-35', maxDepth: 5000, maxHookLoad: 500, rotaryTorque: 50000, pumpPressure: 5500,
    derrickCapacity: '625 t', mobilizationTime: '15-20 Tage', footprint: 'Mittel' },
  { name: 'T-146', drawworks: 'NOV ADS-6T (1250 HP)', mudPumps: '2x NOV 14-P-160', topDrive: 'NOV TDS-4H',
    dayRate: '26000', crewSize: '30-35', maxDepth: 5000, maxHookLoad: 500, rotaryTorque: 50000, pumpPressure: 5500,
    derrickCapacity: '625 t', mobilizationTime: '15-20 Tage', footprint: 'Mittel' },
  { name: 'T-147', drawworks: 'NOV ADS-6T (1250 HP)', mudPumps: '2x NOV 14-P-160', topDrive: 'NOV TDS-4H',
    dayRate: '26000', crewSize: '30-35', maxDepth: 5000, maxHookLoad: 500, rotaryTorque: 50000, pumpPressure: 5500,
    derrickCapacity: '625 t', mobilizationTime: '15-20 Tage', footprint: 'Mittel' },
  { name: 'T-849', drawworks: 'National 1625-DE (1500 HP)', mudPumps: '2x Wirth TPK-1300', topDrive: 'Bentec TDS-250',
    dayRate: '28000', crewSize: '30-40', maxDepth: 5500, maxHookLoad: 550, rotaryTorque: 55000, pumpPressure: 6000,
    derrickCapacity: '750 t', mobilizationTime: '20-25 Tage', footprint: 'Mittel' },
  { name: 'T-858', drawworks: 'Bentec EuroDW 1500', mudPumps: '2x Continental Emsco F-1300', topDrive: 'NOV TDS-4S',
    dayRate: '28000', crewSize: '30-40', maxDepth: 5500, maxHookLoad: 550, rotaryTorque: 55000, pumpPressure: 6000,
    derrickCapacity: '750 t', mobilizationTime: '20-25 Tage', footprint: 'Mittel' },
  { name: 'T-859', drawworks: 'NOV ADS-7T (1500 HP)', mudPumps: '2x NOV 14-P-160', topDrive: 'Canrig 8050E',
    dayRate: '28000', crewSize: '30-40', maxDepth: 5500, maxHookLoad: 550, rotaryTorque: 55000, pumpPressure: 6000,
    derrickCapacity: '750 t', mobilizationTime: '20-25 Tage', footprint: 'Mittel' },

  // === Kompakt 1000 HP ===
  { name: 'T-895', drawworks: 'Bentec EuroDW 1000', mudPumps: '2x Wirth TPK-800', topDrive: 'Canrig 7005',
    dayRate: '18000', crewSize: '22-28', maxDepth: 3500, maxHookLoad: 350, rotaryTorque: 35000, pumpPressure: 5000,
    derrickCapacity: '500 t', mobilizationTime: '10-15 Tage', footprint: 'Klein' },
  { name: 'T-896', drawworks: 'Bentec EuroDW 1000', mudPumps: '2x Wirth TPK-800', topDrive: 'Canrig 7005',
    dayRate: '18000', crewSize: '22-28', maxDepth: 3500, maxHookLoad: 350, rotaryTorque: 35000, pumpPressure: 5000,
    derrickCapacity: '500 t', mobilizationTime: '10-15 Tage', footprint: 'Klein' },
  { name: 'T-897', drawworks: 'Bentec EuroDW 1000', mudPumps: '2x Continental Emsco F-800', topDrive: 'NOV TDS-3H',
    dayRate: '18000', crewSize: '22-28', maxDepth: 3500, maxHookLoad: 350, rotaryTorque: 35000, pumpPressure: 5000,
    derrickCapacity: '500 t', mobilizationTime: '10-15 Tage', footprint: 'Klein' },
  { name: 'T-898', drawworks: 'Bentec EuroDW 1000', mudPumps: '2x Continental Emsco F-800', topDrive: 'NOV TDS-3H',
    dayRate: '18000', crewSize: '22-28', maxDepth: 3500, maxHookLoad: 350, rotaryTorque: 35000, pumpPressure: 5000,
    derrickCapacity: '500 t', mobilizationTime: '10-15 Tage', footprint: 'Klein' },
  { name: 'T-899', drawworks: 'Bentec EuroDW 1000', mudPumps: '2x Wirth TPK-800', topDrive: 'Bentec TDS-150',
    dayRate: '18000', crewSize: '22-28', maxDepth: 3500, maxHookLoad: 350, rotaryTorque: 35000, pumpPressure: 5000,
    derrickCapacity: '500 t', mobilizationTime: '10-15 Tage', footprint: 'Klein' },

  // === Kompakt 800 HP ===
  { name: 'T-801', drawworks: 'Ideco H-44 (800 HP)', mudPumps: '1x Continental Emsco F-800', topDrive: 'NOV TDS-3H',
    dayRate: '14000', crewSize: '20-25', maxDepth: 3000, maxHookLoad: 280, rotaryTorque: 28000, pumpPressure: 4500,
    derrickCapacity: '400 t', mobilizationTime: '7-12 Tage', footprint: 'Klein' },
  { name: 'T-826', drawworks: 'Cardwell KB-660 (800 HP)', mudPumps: '1x Wirth TPK-800', topDrive: 'NOV TDS-3H',
    dayRate: '13000', crewSize: '20-25', maxDepth: 3000, maxHookLoad: 270, rotaryTorque: 27000, pumpPressure: 4500,
    derrickCapacity: '380 t', mobilizationTime: '7-10 Tage', footprint: 'Klein' },
  { name: 'T-853', drawworks: 'National 80B (800 HP)', mudPumps: '1x Continental Emsco F-800', topDrive: 'Bentec TDS-150',
    dayRate: '14000', crewSize: '20-25', maxDepth: 3000, maxHookLoad: 280, rotaryTorque: 28000, pumpPressure: 4500,
    derrickCapacity: '400 t', mobilizationTime: '7-12 Tage', footprint: 'Klein' },
  { name: 'T-872', drawworks: 'Ideco H-44 (800 HP)', mudPumps: '1x Wirth TPK-800', topDrive: 'Canrig 7005',
    dayRate: '14000', crewSize: '20-25', maxDepth: 3000, maxHookLoad: 280, rotaryTorque: 28000, pumpPressure: 4500,
    derrickCapacity: '400 t', mobilizationTime: '7-12 Tage', footprint: 'Klein' },
];

async function main() {
  console.log('🔧 Updating Rig Equipment with Manufacturer Data');
  console.log('=================================================\n');

  let updated = 0;
  let notFound = 0;

  for (const rig of rigUpdates) {
    const existing = await prisma.rig.findFirst({ where: { name: rig.name } });
    
    if (existing) {
      await prisma.rig.update({
        where: { id: existing.id },
        data: {
          drawworks: rig.drawworks,
          mudPumps: rig.mudPumps,
          topDrive: rig.topDrive,
          dayRate: rig.dayRate,
          crewSize: rig.crewSize,
          maxDepth: rig.maxDepth,
          maxHookLoad: rig.maxHookLoad,
          rotaryTorque: rig.rotaryTorque,
          pumpPressure: rig.pumpPressure,
          derrickCapacity: rig.derrickCapacity,
          mobilizationTime: rig.mobilizationTime,
          footprint: rig.footprint,
        },
      });
      console.log(`   ✅ ${rig.name} → DW: ${rig.drawworks} | MP: ${rig.mudPumps} | TD: ${rig.topDrive} | €${rig.dayRate}/d`);
      updated++;
    } else {
      console.log(`   ⚠️  ${rig.name} not found in database`);
      notFound++;
    }
  }

  // Also update any rigs that weren't in our list (like T75) with sensible defaults
  const allRigs = await prisma.rig.findMany();
  const updatedNames = new Set(rigUpdates.map(r => r.name));
  
  for (const rig of allRigs) {
    if (!updatedNames.has(rig.name) && (rig.drawworks === 'N/A' || rig.drawworks === '' || rig.dayRate === '0' || rig.dayRate === 'NaN')) {
      // Determine equipment based on category
      let updates: Partial<RigUpdate> = {};
      
      if (rig.category === 'Schwerlast') {
        updates = { drawworks: 'Bentec EuroDW 2000', mudPumps: '2x Wirth TPK-1600', topDrive: 'NOV TDS-11SA', dayRate: '35000' };
      } else if (rig.category === 'Mittlere Leistung') {
        updates = { drawworks: 'Bentec EuroDW 1250', mudPumps: '2x Wirth TPK-1600', topDrive: 'Bentec TDS-250', dayRate: '25000' };
      } else {
        updates = { drawworks: 'Bentec EuroDW 1000', mudPumps: '2x Wirth TPK-800', topDrive: 'Canrig 7005', dayRate: '18000' };
      }

      await prisma.rig.update({
        where: { id: rig.id },
        data: updates,
      });
      console.log(`   🔄 ${rig.name} (extra) → DW: ${updates.drawworks} | MP: ${updates.mudPumps} | TD: ${updates.topDrive} | €${updates.dayRate}/d`);
      updated++;
    }
  }

  console.log(`\n🎉 Done! ${updated} rigs updated, ${notFound} not found.`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
