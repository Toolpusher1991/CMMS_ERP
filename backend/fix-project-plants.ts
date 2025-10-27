import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixProjectPlants() {
  try {
    console.log('🔧 Fixing project plant fields...');
    console.log('Database URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');

    // Get all projects
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        projectNumber: true,
        plant: true,
        name: true,
      },
    });

    console.log(`\nFound ${projects.length} projects:\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const project of projects) {
      // Extract plant from projectNumber (e.g., "T700-1761595227920" -> "T700")
      const plantMatch = project.projectNumber.match(/^(T\d+)/);
      
      if (plantMatch && plantMatch[1]) {
        const plant = plantMatch[1];
        
        if (project.plant !== plant) {
          console.log(`📝 Updating "${project.name}" (${project.projectNumber})`);
          console.log(`   Plant: "${project.plant}" -> "${plant}"`);
          
          await prisma.project.update({
            where: { id: project.id },
            data: { plant },
          });
          updatedCount++;
        } else {
          console.log(`✓ "${project.name}" (${project.projectNumber}) - plant already correct: ${plant}`);
          skippedCount++;
        }
      } else {
        console.warn(`⚠️ Could not extract plant from "${project.name}" (${project.projectNumber})`);
      }
    }

    console.log(`\n✅ Done! Updated ${updatedCount} projects, skipped ${skippedCount} projects`);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixProjectPlants();
