import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixProjectPlants() {
  try {
    console.log('🔧 Fixing project plant fields...');

    // Get all projects
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        projectNumber: true,
        plant: true,
      },
    });

    console.log(`Found ${projects.length} projects`);

    for (const project of projects) {
      // Extract plant from projectNumber (e.g., "T700-1761595227920" -> "T700")
      const plantMatch = project.projectNumber.match(/^(T\d+)/);
      
      if (plantMatch && plantMatch[1]) {
        const plant = plantMatch[1];
        
        if (project.plant !== plant) {
          console.log(`Updating ${project.projectNumber}: plant "${project.plant}" -> "${plant}"`);
          
          await prisma.project.update({
            where: { id: project.id },
            data: { plant },
          });
        } else {
          console.log(`✓ ${project.projectNumber}: plant already correct (${plant})`);
        }
      } else {
        console.warn(`⚠️ Could not extract plant from ${project.projectNumber}`);
      }
    }

    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProjectPlants();
