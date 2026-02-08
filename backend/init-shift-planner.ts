import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initShiftPlanner() {
  console.log('🚀 Initializing Shift Planner...\n');

  const plants = ['T208', 'T207', 'T46', 'T700'];
  
  const positions = [
    { name: 'TP', displayName: 'Toolpusher', order: 1 },
    { name: 'EL', displayName: 'Electrician', order: 2 },
    { name: 'ME', displayName: 'Mechanic', order: 3 },
    { name: 'Driller', displayName: 'Driller', order: 4 },
    { name: 'AD', displayName: 'Assistant Driller', order: 5 },
    { name: 'RN1', displayName: 'Roughneck 1', order: 6 },
    { name: 'RN2', displayName: 'Roughneck 2', order: 7 },
    { name: 'RN3', displayName: 'Roughneck 3', order: 8 },
    { name: 'RN4', displayName: 'Roughneck 4', order: 9 },
  ];

  try {
    // Create positions for each plant
    for (const plant of plants) {
      console.log(`\n📍 Creating positions for ${plant}...`);
      
      for (const pos of positions) {
        await prisma.shiftPosition.upsert({
          where: {
            plant_name: {
              plant,
              name: pos.name,
            },
          },
          update: {},
          create: {
            plant,
            name: pos.name,
            displayName: pos.displayName,
            order: pos.order,
            isActive: true,
          },
        });
      }
      
      console.log(`✅ Created ${positions.length} positions for ${plant}`);
    }

    // Create personnel (A & B teams) for each plant and position
    for (const plant of plants) {
      console.log(`\n👷 Creating personnel for ${plant}...`);
      let personnelCount = 0;
      
      for (const pos of positions) {
        // A-Team
        await prisma.shiftPersonnel.upsert({
          where: {
            plant_code: {
              plant,
              code: `${pos.name}-A`,
            },
          },
          update: {},
          create: {
            plant,
            code: `${pos.name}-A`,
            position: pos.name,
            isBackToBack: false,
            isActive: true,
          },
        });
        personnelCount++;
        
        // B-Team (Back-to-back)
        await prisma.shiftPersonnel.upsert({
          where: {
            plant_code: {
              plant,
              code: `${pos.name}-B`,
            },
          },
          update: {},
          create: {
            plant,
            code: `${pos.name}-B`,
            position: pos.name,
            isBackToBack: true,
            isActive: true,
          },
        });
        personnelCount++;
      }
      
      console.log(`✅ Created ${personnelCount} personnel for ${plant}`);
    }

    // Summary
    console.log('\n\n🎉 Shift Planner Initialization Complete!\n');
    console.log('📊 Summary:');
    console.log(`   Plants: ${plants.length} (${plants.join(', ')})`);
    console.log(`   Positions per plant: ${positions.length}`);
    console.log(`   Personnel per plant: ${positions.length * 2} (A & B teams)`);
    console.log(`   Total positions: ${plants.length * positions.length}`);
    console.log(`   Total personnel: ${plants.length * positions.length * 2}`);
    
    console.log('\n✨ Ready to generate rotations!');
    console.log('   Use POST /api/shift-planner/generate-rotation with:');
    console.log('   {');
    console.log('     "plant": "T208",');
    console.log('     "startYear": 2026,');
    console.log('     "startMonth": 2,  // February');
    console.log('     "endYear": 2026,');
    console.log('     "endMonth": 8,    // August');
    console.log('     "workDays": 28,');
    console.log('     "offDays": 28');
    console.log('   }');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

initShiftPlanner();
