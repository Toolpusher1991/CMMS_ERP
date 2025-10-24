import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateProjectPlants() {
  console.log('🔄 Updating project plants...');

  try {
    // Update each project with its corresponding plant
    const updates = await Promise.all([
      prisma.project.updateMany({
        where: { projectNumber: 'T208' },
        data: { plant: 'T208' },
      }),
      prisma.project.updateMany({
        where: { projectNumber: 'T207' },
        data: { plant: 'T207' },
      }),
      prisma.project.updateMany({
        where: { projectNumber: 'T700' },
        data: { plant: 'T700' },
      }),
      prisma.project.updateMany({
        where: { projectNumber: 'T46' },
        data: { plant: 'T46' },
      }),
    ]);

    console.log('✅ Updated projects:');
    console.log(`   - T208: ${updates[0].count} project(s)`);
    console.log(`   - T207: ${updates[1].count} project(s)`);
    console.log(`   - T700: ${updates[2].count} project(s)`);
    console.log(`   - T46: ${updates[3].count} project(s)`);

    // Verify
    const projects = await prisma.project.findMany({
      select: { projectNumber: true, name: true, plant: true },
    });

    console.log('\n📋 Current projects:');
    projects.forEach((p) => {
      console.log(`   ${p.projectNumber} - ${p.name} (Plant: ${p.plant || 'NULL'})`);
    });
  } catch (error) {
    console.error('❌ Error updating projects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateProjectPlants();
