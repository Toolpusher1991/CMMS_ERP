const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    // Prüfe Projects
    const projects = await prisma.project.findMany();
    console.log('\n📊 PROJECTS IN DATABASE:', projects.length);
    projects.forEach(p => {
      console.log(`  - ${p.projectNumber}: ${p.name} (Status: ${p.status})`);
    });

    // Prüfe Tasks (falls vorhanden)
    try {
      const tasks = await prisma.task?.findMany() || [];
      console.log('\n✅ TASKS IN DATABASE:', tasks.length);
      tasks.forEach(t => {
        console.log(`  - ${t.title} (Project: ${t.projectId})`);
      });
    } catch (e) {
      console.log('\n✅ TASKS: Table not found or empty');
    }

    // Prüfe Files (falls vorhanden)
    try {
      const files = await prisma.file?.findMany() || [];
      console.log('\n📁 FILES IN DATABASE:', files.length);
      files.forEach(f => {
        console.log(`  - ${f.filename} (${f.fileType})`);
      });
    } catch (e) {
      console.log('\n📁 FILES: Table not found or empty');
    }

    // Prüfe Users
    const users = await prisma.user.findMany();
    console.log('\n👤 USERS IN DATABASE:', users.length);
    users.forEach(u => {
      console.log(`  - ${u.email} (${u.role})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
