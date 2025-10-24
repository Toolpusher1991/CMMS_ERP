import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteTestProjects() {
  try {
    // Delete test projects by their project numbers
    const testProjectNumbers = ['Test', 'Test1', 'twert', 'test'];
    
    console.log('🗑️  Lösche Test-Projekte...\n');
    
    for (const projectNumber of testProjectNumbers) {
      const result = await prisma.project.deleteMany({
        where: {
          projectNumber: projectNumber,
        },
      });
      
      if (result.count > 0) {
        console.log(`✅ Gelöscht: ${projectNumber}`);
      } else {
        console.log(`⚠️  Nicht gefunden: ${projectNumber}`);
      }
    }
    
    console.log('\n📊 Verbleibende Projekte:\n');
    const remainingProjects = await prisma.project.findMany();
    
    remainingProjects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name} (${project.projectNumber})`);
    });
    
    console.log(`\nTotal: ${remainingProjects.length} Projekt(e)\n`);
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTestProjects();
