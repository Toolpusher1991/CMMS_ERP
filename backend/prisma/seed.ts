import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Check if admin already exists
  let admin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });

  if (!admin) {
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    console.log('✅ Created admin user:', {
      email: admin.email,
      name: `${admin.firstName} ${admin.lastName}`,
      role: admin.role,
    });
  } else {
    console.log('✅ Admin user already exists');
  }

  // Check if user already exists
  let user = await prisma.user.findUnique({
    where: { email: 'user@example.com' },
  });

  if (!user) {
    // Create a regular user
    const userPassword = await bcrypt.hash('user123', 10);
    
    user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        password: userPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        isActive: true,
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    console.log('✅ Created regular user:', {
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
    });
  } else {
    console.log('✅ Regular user already exists');
  }

  // Create Rig Personnel (Elektriker, Mechaniker, Toolpusher, Rig Manager, Supply Coordinator)
  // For each rig: T208, T207, T700, T46
  
  const rigs = ['T208', 'T207', 'T700', 'T46'];
  const roles = [
    { role: 'Elektriker', email: 'elektriker' },
    { role: 'Mechaniker', email: 'mechaniker' },
    { role: 'Toolpusher', email: 'toolpusher' },
    { role: 'Rig Manager', email: 'rigmanager' },
    { role: 'Supply Coordinator', email: 'supply' },
  ];

  const defaultPassword = await bcrypt.hash('rig123', 10);
  let newUsersCount = 0;

  for (const rig of rigs) {
    for (const { role, email } of roles) {
      const userEmail = `${email}.${rig.toLowerCase()}@rigcrew.com`;
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            email: userEmail,
            password: defaultPassword,
            firstName: role,
            lastName: rig,
            role: 'USER',
            assignedPlant: rig, // User ist spezifisch dieser Anlage zugewiesen
            isActive: true,
            approvalStatus: 'APPROVED',
            approvedAt: new Date(),
          },
        });
        newUsersCount++;
      }
    }
  }

  if (newUsersCount > 0) {
    console.log(`✅ Created ${newUsersCount} rig crew members across 4 rigs`);
    console.log('   - Per Rig: Elektriker, Mechaniker, Toolpusher, Rig Manager, Supply Coordinator');
  } else {
    console.log('✅ Rig crew members already exist');
  }

  // Seed Projects (T208, T700, T207, T46)
  const existingProjects = await prisma.project.count();
  
  if (existingProjects === 0) {
    await prisma.project.createMany({
      data: [
        {
          projectNumber: 'T208',
          name: 'Sicherheitsupdate Q4',
          description: 'Update der Sicherheitssysteme und Protokolle',
          status: 'IN_PROGRESS',
          priority: 'URGENT',
          progress: 65,
          totalBudget: 75000,
          spentBudget: 48750,
          startDate: new Date('2025-09-01'),
          endDate: new Date('2025-12-31'),
          managerId: admin.id,
          createdBy: admin.id,
        },
        {
          projectNumber: 'T700',
          name: 'Komplett-Überholung 2025',
          description: 'Vollständige Überholung und Modernisierung',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          progress: 45,
          totalBudget: 200000,
          spentBudget: 90000,
          startDate: new Date('2025-01-15'),
          endDate: new Date('2025-06-30'),
          managerId: admin.id,
          createdBy: admin.id,
        },
        {
          projectNumber: 'T207',
          name: 'Digitalisierung Infrastruktur',
          description: 'Implementierung digitaler Wartungssysteme',
          status: 'PLANNED',
          priority: 'NORMAL',
          progress: 10,
          totalBudget: 150000,
          spentBudget: 5000,
          startDate: new Date('2025-11-01'),
          endDate: new Date('2026-03-31'),
          managerId: admin.id,
          createdBy: admin.id,
        },
        {
          projectNumber: 'T46',
          name: 'Energieeffizienz Optimierung',
          description: 'Verbesserung der Energieeffizienz der Anlagen',
          status: 'COMPLETED',
          priority: 'LOW',
          progress: 100,
          totalBudget: 50000,
          spentBudget: 47500,
          startDate: new Date('2025-04-01'),
          endDate: new Date('2025-08-31'),
          managerId: user!.id,
          createdBy: admin.id,
        },
      ],
    });

    console.log('✅ Created 4 projects: T208, T700, T207, T46');
  } else {
    console.log(`✅ Projects already exist (${existingProjects} projects found)`);
  }

  // Seed Rigs (Bohranlagen)
  const existingRigs = await prisma.rig.count();
  
  if (existingRigs === 0) {
    await prisma.rig.createMany({
      data: [
        {
          id: 't700',
          name: 'T700',
          category: 'Schwerlast',
          maxDepth: 7000,
          maxHookLoad: 700,
          footprint: 'Groß',
          rotaryTorque: 85000,
          pumpPressure: 7500,
          drawworks: '2000 HP',
          mudPumps: '2x 2200 HP Triplex',
          topDrive: '1000 HP',
          derrickCapacity: '1000 t',
          crewSize: '45-50',
          mobilizationTime: '30-45 Tage',
          dayRate: '85000',
          description: 'Hochleistungs-Bohranlage für Tiefbohrungen und extreme Lasten',
          applications: JSON.stringify(['Tiefbohrungen', 'Offshore', 'Hochdruck-Formationen']),
          technicalSpecs: 'API 4F Zertifizierung, DNV-GL Standard, vollautomatisches Pipe Handling',
        },
        {
          id: 't46',
          name: 'T46',
          category: 'Schwerlast',
          maxDepth: 6000,
          maxHookLoad: 460,
          footprint: 'Groß',
          rotaryTorque: 65000,
          pumpPressure: 7000,
          drawworks: '1500 HP',
          mudPumps: '2x 1600 HP Triplex',
          topDrive: '750 HP',
          derrickCapacity: '650 t',
          crewSize: '40-45',
          mobilizationTime: '25-35 Tage',
          dayRate: '65000',
          description: 'Vielseitige Schwerlast-Bohranlage für mittlere bis tiefe Bohrungen',
          applications: JSON.stringify(['Mittlere Tiefbohrungen', 'Onshore', 'Standardformationen']),
          technicalSpecs: 'API 8C Zertifizierung, automatisches Roughneck System',
        },
        {
          id: 't350',
          name: 'T350',
          category: 'Mittlere Leistung',
          maxDepth: 4500,
          maxHookLoad: 350,
          footprint: 'Mittel',
          rotaryTorque: 45000,
          pumpPressure: 5500,
          drawworks: '1200 HP',
          mudPumps: '2x 1200 HP Triplex',
          topDrive: '500 HP',
          derrickCapacity: '450 t',
          crewSize: '30-35',
          mobilizationTime: '20-25 Tage',
          dayRate: '48000',
          description: 'Ausgewogene Lösung für mittlere Bohrtiefen',
          applications: JSON.stringify(['Mittlere Bohrungen', 'Onshore', 'Vielseitig einsetzbar']),
          technicalSpecs: 'Kompaktes Design, modularer Aufbau',
        },
        {
          id: 't208',
          name: 'T208',
          category: 'Kompakt',
          maxDepth: 3000,
          maxHookLoad: 208,
          footprint: 'Klein',
          rotaryTorque: 28000,
          pumpPressure: 4500,
          drawworks: '750 HP',
          mudPumps: '1x 1000 HP Triplex',
          topDrive: '350 HP',
          derrickCapacity: '250 t',
          crewSize: '20-25',
          mobilizationTime: '10-15 Tage',
          dayRate: '32000',
          description: 'Kompakte Bohranlage für begrenzte Platzverhältnisse',
          applications: JSON.stringify(['Flache Bohrungen', 'Platzbeschränkte Standorte', 'Workover']),
          technicalSpecs: 'Schnelle Mobilisierung, minimaler Footprint',
        },
        {
          id: 't207',
          name: 'T207',
          category: 'Kompakt',
          maxDepth: 2800,
          maxHookLoad: 207,
          footprint: 'Klein',
          rotaryTorque: 25000,
          pumpPressure: 4200,
          drawworks: '700 HP',
          mudPumps: '1x 900 HP Triplex',
          topDrive: '300 HP',
          derrickCapacity: '230 t',
          crewSize: '18-22',
          mobilizationTime: '8-12 Tage',
          dayRate: '28000',
          description: 'Platzsparende Lösung für flache bis mittlere Bohrungen',
          applications: JSON.stringify(['Flache Bohrungen', 'Enge Standorte', 'Wartungsarbeiten']),
          technicalSpecs: 'Containerbasiert, schneller Auf-/Abbau',
        },
      ],
    });

    console.log('✅ Created 5 rigs: T700, T46, T350, T208, T207');
  } else {
    console.log(`✅ Rigs already exist (${existingRigs} rigs found)`);
  }

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📝 Login credentials:');
  console.log('Admin:     admin@example.com / admin123');
  console.log('User:      user@example.com / user123');
  console.log('\n👷 Rig Crew Login (all rigs):');
  console.log('Password for all crew: rig123');
  console.log('\nT208 Crew:');
  console.log('  - elektriker.t208@rigcrew.com');
  console.log('  - mechaniker.t208@rigcrew.com');
  console.log('  - toolpusher.t208@rigcrew.com');
  console.log('  - rigmanager.t208@rigcrew.com');
  console.log('  - supply.t208@rigcrew.com');
  console.log('\nT207 Crew:');
  console.log('  - elektriker.t207@rigcrew.com');
  console.log('  - mechaniker.t207@rigcrew.com');
  console.log('  - toolpusher.t207@rigcrew.com');
  console.log('  - rigmanager.t207@rigcrew.com');
  console.log('  - supply.t207@rigcrew.com');
  console.log('\nT700 Crew:');
  console.log('  - elektriker.t700@rigcrew.com');
  console.log('  - mechaniker.t700@rigcrew.com');
  console.log('  - toolpusher.t700@rigcrew.com');
  console.log('  - rigmanager.t700@rigcrew.com');
  console.log('  - supply.t700@rigcrew.com');
  console.log('\nT46 Crew:');
  console.log('  - elektriker.t46@rigcrew.com');
  console.log('  - mechaniker.t46@rigcrew.com');
  console.log('  - toolpusher.t46@rigcrew.com');
  console.log('  - rigmanager.t46@rigcrew.com');
  console.log('  - supply.t46@rigcrew.com');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
