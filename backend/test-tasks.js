const { PrismaClient } = require('@prisma/client');

async function testTasks() {
  const prisma = new PrismaClient();
  
  try {
    // Get current user
    const user = await prisma.user.findFirst({
      where: { email: 'nils.wanning@maintai.de' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ Current User:', user.email, `(${user.firstName} ${user.lastName})`);
    console.log('');
    
    // Get all tasks
    const allTasks = await prisma.task.findMany({
      include: {
        project: true
      }
    });
    
    console.log(`📋 Total Tasks in DB: ${allTasks.length}`);
    console.log('');
    
    // Filter tasks assigned to user
    const myTasks = allTasks.filter(t => t.assignedTo === user.email && t.status !== 'DONE');
    
    console.log(`✅ My Tasks (not DONE): ${myTasks.length}`);
    myTasks.forEach(t => {
      console.log(`  - ${t.title}`);
      console.log(`    Assigned: ${t.assignedTo}`);
      console.log(`    Status: ${t.status}`);
      console.log(`    Project: ${t.project?.name || 'N/A'}`);
      console.log('');
    });
    
    // Show all tasks for debugging
    console.log('📊 All Tasks:');
    allTasks.forEach(t => {
      console.log(`  - ${t.title} | ${t.assignedTo} | ${t.status} | ${t.project?.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTasks();
