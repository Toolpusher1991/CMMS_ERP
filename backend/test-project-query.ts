import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testQuery() {
  try {
    // Simuliere die User-ID (ersetze mit echter Admin-ID)
    const userId = '0355a905-4b73-4902-b241-89f316e57cce'; // Admin User ID
    
    console.log('Testing project query with projectNumber filter...\n');
    
    // Test 1: Ohne Filter
    const allProjects = await prisma.project.findMany({
      where: {
        OR: [
          { managerId: userId },
          { createdBy: userId },
        ],
      },
    });
    
    console.log(`✅ Without projectNumber filter: ${allProjects.length} projects found`);
    allProjects.forEach(p => console.log(`   - ${p.name} (${p.projectNumber})`));
    
    // Test 2: Mit projectNumber Filter (wie im Chatbot)
    const where: Record<string, unknown> = {
      OR: [
        { managerId: userId },
        { createdBy: userId },
      ],
    };
    where.projectNumber = 'T208';
    
    const filteredProjects = await prisma.project.findMany({
      where,
      include: {
        manager: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
    
    console.log(`\n✅ With projectNumber='T208': ${filteredProjects.length} projects found`);
    filteredProjects.forEach(p => {
      console.log(`   - ${p.name} (${p.projectNumber})`);
      console.log(`     Manager: ${p.manager?.firstName} ${p.manager?.lastName}`);
      console.log(`     Status: ${p.status}`);
      console.log(`     Tasks: ${p.tasks.length}`);
    });
    
    // Test 3: Prüfe das T208-Projekt direkt
    const t208 = await prisma.project.findUnique({
      where: { projectNumber: 'T208' },
      include: {
        manager: true,
        creator: true,
      },
    });
    
    console.log('\n✅ T208 Project Details:');
    console.log(`   Name: ${t208?.name}`);
    console.log(`   Manager ID: ${t208?.managerId}`);
    console.log(`   Manager: ${t208?.manager?.firstName} ${t208?.manager?.lastName}`);
    console.log(`   Creator ID: ${t208?.createdBy}`);
    console.log(`   Creator: ${t208?.creator?.firstName} ${t208?.creator?.lastName}`);
    console.log(`   \n   Match Manager? ${t208?.managerId === userId}`);
    console.log(`   Match Creator? ${t208?.createdBy === userId}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuery();
