const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const actions = await prisma.action.findMany({
    select: {
      id: true,
      plant: true,
      category: true,
      title: true,
    },
  });

  console.log('\n=== All Actions ===');
  actions.forEach(action => {
    console.log(`ID: ${action.id}`);
    console.log(`Plant: ${action.plant}`);
    console.log(`Category: ${action.category || 'NULL'}`);
    console.log(`Title: ${action.title}`);
    console.log('---');
  });
  
  console.log(`\nTotal: ${actions.length} actions`);
  console.log(`RIGMOVE: ${actions.filter(a => a.category === 'RIGMOVE').length}`);
  console.log(`ALLGEMEIN: ${actions.filter(a => a.category === 'ALLGEMEIN').length}`);
  console.log(`NULL: ${actions.filter(a => !a.category).length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
