import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProjects() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        manager: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    console.log(`\n📊 Total projects in database: ${projects.length}\n`);
    
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name}`);
      console.log(`   - Nummer: ${project.projectNumber}`);
      console.log(`   - Status: ${project.status}`);
      console.log(`   - Priorität: ${project.priority}`);
      console.log(`   - Fortschritt: ${project.progress}%`);
      console.log(`   - Manager: ${project.manager?.firstName} ${project.manager?.lastName}`);
      console.log(`   - Created: ${project.createdAt}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjects();
