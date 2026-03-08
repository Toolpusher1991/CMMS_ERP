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

  // Create Rig Personnel
  // For each rig: dynamically based on new fleet
  
  const rigs = ['T-51', 'T-91', 'T-92', 'T-93', 'T-94', 'T-95', 'T-144', 'T-145', 'T-146', 'T-147',
    'T-801', 'T-826', 'T-849', 'T-853', 'T-858', 'T-859', 'T-867', 'T-872', 'T-889',
    'T-895', 'T-896', 'T-897', 'T-898', 'T-899'];
  const roles = [
    { role: 'Elektriker', email: 'EL' },      // EL = Elektriker
    { role: 'Mechaniker', email: 'ME' },      // ME = Mechaniker
    { role: 'Toolpusher', email: 'TP' },      // TP = Toolpusher
    { role: 'Rig Manager', email: 'RM' },     // RM = Rig Manager
    { role: 'Supply Coordinator', email: 'RSC' }, // RSC = Rig Supply Coordinator
  ];

  const defaultPassword = await bcrypt.hash('rig123', 10);
  let newUsersCount = 0;

  for (const rig of rigs) {
    for (const { role, email } of roles) {
      const userEmail = `${rig}.${email}@maintain.com`;
      
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
    console.log(`✅ Created ${newUsersCount} rig crew members across ${rigs.length} rigs`);
    console.log('   - Per Rig: Elektriker, Mechaniker, Toolpusher, Rig Manager, Supply Coordinator');
  } else {
    console.log('✅ Rig crew members already exist');
  }

  // Seed Projects
  const existingProjects = await prisma.project.count();
  
  if (existingProjects === 0) {
    await prisma.project.createMany({
      data: [
        {
          projectNumber: 'T-51',
          name: 'Sicherheitsupdate Q1',
          description: 'Update der Sicherheitssysteme und Protokolle',
          status: 'IN_PROGRESS',
          priority: 'URGENT',
          progress: 65,
          totalBudget: 75000,
          spentBudget: 48750,
          startDate: new Date('2025-09-01'),
          endDate: new Date('2026-03-31'),
          managerId: admin.id,
          createdBy: admin.id,
          plant: 'T-51',
        },
        {
          projectNumber: 'T-91',
          name: 'Komplett-Überholung 2026',
          description: 'Vollständige Überholung und Modernisierung',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          progress: 45,
          totalBudget: 200000,
          spentBudget: 90000,
          startDate: new Date('2026-01-15'),
          endDate: new Date('2026-06-30'),
          managerId: admin.id,
          createdBy: admin.id,
          plant: 'T-91',
        },
        {
          projectNumber: 'T-144',
          name: 'Digitalisierung Infrastruktur',
          description: 'Implementierung digitaler Wartungssysteme',
          status: 'PLANNED',
          priority: 'NORMAL',
          progress: 10,
          totalBudget: 150000,
          spentBudget: 5000,
          startDate: new Date('2026-03-01'),
          endDate: new Date('2026-08-31'),
          managerId: admin.id,
          createdBy: admin.id,
          plant: 'T-144',
        },
        {
          projectNumber: 'T-867',
          name: 'Energieeffizienz Optimierung',
          description: 'Verbesserung der Energieeffizienz der Anlagen',
          status: 'PLANNED',
          priority: 'NORMAL',
          progress: 0,
          totalBudget: 50000,
          spentBudget: 0,
          startDate: new Date('2026-04-01'),
          endDate: new Date('2026-08-31'),
          managerId: user!.id,
          createdBy: admin.id,
          plant: 'T-867',
        },
      ],
    });

    console.log('✅ Created 4 projects: T-51, T-91, T-144, T-867');
  } else {
    console.log(`✅ Projects already exist (${existingProjects} projects found)`);
  }

  // Seed Rigs (Equipment Master Database – Komplette Flotte mit realen Herstellerdaten)
  const existingRigs = await prisma.rig.count();
  
  if (existingRigs === 0) {
    const rigFleet = [
      // === Schwerlast (2000+ HP) ===
      { id: 't51',  name: 'T-51',  rigType: 'EMSCO C-3 III',       hp: 3000, year: 1980, category: 'Schwerlast',
        drawworks: 'Continental Emsco C-3 (3000 HP)', mudPumps: '3x Continental Emsco F-1600', topDrive: 'NOV TDS-11SA (750 ton)',
        dayRate: '45000', crewSize: '45-55', maxDepth: 8000, maxHookLoad: 1000, rotaryTorque: 105000, pumpPressure: 7500,
        derrickCapacity: '1500 t', mobilizationTime: '45-60 Tage', footprint: 'Groß' },
      { id: 't91',  name: 'T-91',  rigType: '2000 HP Stationary',   hp: 2000, year: 2014, category: 'Schwerlast',
        drawworks: 'Bentec EuroDW 2000', mudPumps: '2x Wirth TPK-1600', topDrive: 'Bentec TDS-500',
        dayRate: '38000', crewSize: '40-50', maxDepth: 7000, maxHookLoad: 700, rotaryTorque: 70000, pumpPressure: 7500,
        derrickCapacity: '1000 t', mobilizationTime: '30-45 Tage', footprint: 'Groß' },
      { id: 't92',  name: 'T-92',  rigType: '2000 HP Stationary',   hp: 2000, year: 2014, category: 'Schwerlast',
        drawworks: 'Bentec EuroDW 2000', mudPumps: '2x Wirth TPK-1600', topDrive: 'Bentec TDS-500',
        dayRate: '38000', crewSize: '40-50', maxDepth: 7000, maxHookLoad: 700, rotaryTorque: 70000, pumpPressure: 7500,
        derrickCapacity: '1000 t', mobilizationTime: '30-45 Tage', footprint: 'Groß' },
      { id: 't93',  name: 'T-93',  rigType: '2000 HP Stationary',   hp: 2000, year: 2015, category: 'Schwerlast',
        drawworks: 'NOV ADS-10T (2000 HP)', mudPumps: '2x NOV 14-P-220', topDrive: 'NOV TDS-11SA',
        dayRate: '39000', crewSize: '40-50', maxDepth: 7000, maxHookLoad: 700, rotaryTorque: 70000, pumpPressure: 7500,
        derrickCapacity: '1000 t', mobilizationTime: '30-45 Tage', footprint: 'Groß' },
      { id: 't94',  name: 'T-94',  rigType: '2000 HP Stationary',   hp: 2000, year: 2015, category: 'Schwerlast',
        drawworks: 'NOV ADS-10T (2000 HP)', mudPumps: '2x NOV 14-P-220', topDrive: 'NOV TDS-11SA',
        dayRate: '39000', crewSize: '40-50', maxDepth: 7000, maxHookLoad: 700, rotaryTorque: 70000, pumpPressure: 7500,
        derrickCapacity: '1000 t', mobilizationTime: '30-45 Tage', footprint: 'Groß' },
      { id: 't95',  name: 'T-95',  rigType: '2000 HP Stationary',   hp: 2000, year: 2015, category: 'Schwerlast',
        drawworks: 'NOV ADS-10T (2000 HP)', mudPumps: '2x NOV 14-P-220', topDrive: 'NOV TDS-11SA',
        dayRate: '39000', crewSize: '40-50', maxDepth: 7000, maxHookLoad: 700, rotaryTorque: 70000, pumpPressure: 7500,
        derrickCapacity: '1000 t', mobilizationTime: '30-45 Tage', footprint: 'Groß' },
      { id: 't867', name: 'T-867', rigType: '2000 HP Land Rig',     hp: 2000, year: 2014, category: 'Schwerlast',
        drawworks: 'National Oilwell 2000-UE', mudPumps: '2x Continental Emsco F-1600', topDrive: 'Canrig 1275E',
        dayRate: '35000', crewSize: '40-50', maxDepth: 7000, maxHookLoad: 680, rotaryTorque: 68000, pumpPressure: 7500,
        derrickCapacity: '950 t', mobilizationTime: '30-40 Tage', footprint: 'Groß' },
      { id: 't889', name: 'T-889', rigType: '2000 HP Land Rig',     hp: 2000, year: 2006, category: 'Schwerlast',
        drawworks: 'Continental Emsco C-2 (2000 HP)', mudPumps: '2x Wirth TPK-1600', topDrive: 'NOV TDS-8SA',
        dayRate: '33000', crewSize: '40-50', maxDepth: 6500, maxHookLoad: 650, rotaryTorque: 65000, pumpPressure: 7500,
        derrickCapacity: '900 t', mobilizationTime: '30-40 Tage', footprint: 'Groß' },

      // === Mittlere Leistung (1250-1500 HP) ===
      { id: 't144', name: 'T-144', rigType: '1250 HP Mobile',       hp: 1250, year: 2023, category: 'Mittlere Leistung',
        drawworks: 'Bentec EuroDW 1250', mudPumps: '2x Wirth TPK-1600', topDrive: 'Bentec TDS-250',
        dayRate: '25000', crewSize: '30-35', maxDepth: 5000, maxHookLoad: 500, rotaryTorque: 50000, pumpPressure: 5500,
        derrickCapacity: '625 t', mobilizationTime: '15-20 Tage', footprint: 'Mittel' },
      { id: 't145', name: 'T-145', rigType: '1250 HP Mobile',       hp: 1250, year: 2023, category: 'Mittlere Leistung',
        drawworks: 'Bentec EuroDW 1250', mudPumps: '2x Wirth TPK-1600', topDrive: 'Bentec TDS-250',
        dayRate: '25000', crewSize: '30-35', maxDepth: 5000, maxHookLoad: 500, rotaryTorque: 50000, pumpPressure: 5500,
        derrickCapacity: '625 t', mobilizationTime: '15-20 Tage', footprint: 'Mittel' },
      { id: 't146', name: 'T-146', rigType: '1250 HP Mobile',       hp: 1250, year: 2024, category: 'Mittlere Leistung',
        drawworks: 'NOV ADS-6T (1250 HP)', mudPumps: '2x NOV 14-P-160', topDrive: 'NOV TDS-4H',
        dayRate: '26000', crewSize: '30-35', maxDepth: 5000, maxHookLoad: 500, rotaryTorque: 50000, pumpPressure: 5500,
        derrickCapacity: '625 t', mobilizationTime: '15-20 Tage', footprint: 'Mittel' },
      { id: 't147', name: 'T-147', rigType: '1250 HP Mobile',       hp: 1250, year: 2024, category: 'Mittlere Leistung',
        drawworks: 'NOV ADS-6T (1250 HP)', mudPumps: '2x NOV 14-P-160', topDrive: 'NOV TDS-4H',
        dayRate: '26000', crewSize: '30-35', maxDepth: 5000, maxHookLoad: 500, rotaryTorque: 50000, pumpPressure: 5500,
        derrickCapacity: '625 t', mobilizationTime: '15-20 Tage', footprint: 'Mittel' },
      { id: 't849', name: 'T-849', rigType: '1500 HP Mobile',       hp: 1500, year: 2010, category: 'Mittlere Leistung',
        drawworks: 'National 1625-DE (1500 HP)', mudPumps: '2x Wirth TPK-1300', topDrive: 'Bentec TDS-250',
        dayRate: '28000', crewSize: '30-40', maxDepth: 5500, maxHookLoad: 550, rotaryTorque: 55000, pumpPressure: 6000,
        derrickCapacity: '750 t', mobilizationTime: '20-25 Tage', footprint: 'Mittel' },
      { id: 't858', name: 'T-858', rigType: '1500 HP Mobile',       hp: 1500, year: 2010, category: 'Mittlere Leistung',
        drawworks: 'Bentec EuroDW 1500', mudPumps: '2x Continental Emsco F-1300', topDrive: 'NOV TDS-4S',
        dayRate: '28000', crewSize: '30-40', maxDepth: 5500, maxHookLoad: 550, rotaryTorque: 55000, pumpPressure: 6000,
        derrickCapacity: '750 t', mobilizationTime: '20-25 Tage', footprint: 'Mittel' },
      { id: 't859', name: 'T-859', rigType: '1500 HP Mobile',       hp: 1500, year: 2010, category: 'Mittlere Leistung',
        drawworks: 'NOV ADS-7T (1500 HP)', mudPumps: '2x NOV 14-P-160', topDrive: 'Canrig 8050E',
        dayRate: '28000', crewSize: '30-40', maxDepth: 5500, maxHookLoad: 550, rotaryTorque: 55000, pumpPressure: 6000,
        derrickCapacity: '750 t', mobilizationTime: '20-25 Tage', footprint: 'Mittel' },

      // === Kompakt 1000 HP ===
      { id: 't895', name: 'T-895', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt',
        drawworks: 'Bentec EuroDW 1000', mudPumps: '2x Wirth TPK-800', topDrive: 'Canrig 7005',
        dayRate: '18000', crewSize: '22-28', maxDepth: 3500, maxHookLoad: 350, rotaryTorque: 35000, pumpPressure: 5000,
        derrickCapacity: '500 t', mobilizationTime: '10-15 Tage', footprint: 'Klein' },
      { id: 't896', name: 'T-896', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt',
        drawworks: 'Bentec EuroDW 1000', mudPumps: '2x Wirth TPK-800', topDrive: 'Canrig 7005',
        dayRate: '18000', crewSize: '22-28', maxDepth: 3500, maxHookLoad: 350, rotaryTorque: 35000, pumpPressure: 5000,
        derrickCapacity: '500 t', mobilizationTime: '10-15 Tage', footprint: 'Klein' },
      { id: 't897', name: 'T-897', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt',
        drawworks: 'Bentec EuroDW 1000', mudPumps: '2x Continental Emsco F-800', topDrive: 'NOV TDS-3H',
        dayRate: '18000', crewSize: '22-28', maxDepth: 3500, maxHookLoad: 350, rotaryTorque: 35000, pumpPressure: 5000,
        derrickCapacity: '500 t', mobilizationTime: '10-15 Tage', footprint: 'Klein' },
      { id: 't898', name: 'T-898', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt',
        drawworks: 'Bentec EuroDW 1000', mudPumps: '2x Continental Emsco F-800', topDrive: 'NOV TDS-3H',
        dayRate: '18000', crewSize: '22-28', maxDepth: 3500, maxHookLoad: 350, rotaryTorque: 35000, pumpPressure: 5000,
        derrickCapacity: '500 t', mobilizationTime: '10-15 Tage', footprint: 'Klein' },
      { id: 't899', name: 'T-899', rigType: '1000 HP Mobile',       hp: 1000, year: 2015, category: 'Kompakt',
        drawworks: 'Bentec EuroDW 1000', mudPumps: '2x Wirth TPK-800', topDrive: 'Bentec TDS-150',
        dayRate: '18000', crewSize: '22-28', maxDepth: 3500, maxHookLoad: 350, rotaryTorque: 35000, pumpPressure: 5000,
        derrickCapacity: '500 t', mobilizationTime: '10-15 Tage', footprint: 'Klein' },

      // === Kompakt 800 HP ===
      { id: 't801', name: 'T-801', rigType: '800 HP Highly Mobile',  hp: 800,  year: 1992, category: 'Kompakt',
        drawworks: 'Ideco H-44 (800 HP)', mudPumps: '1x Continental Emsco F-800', topDrive: 'NOV TDS-3H',
        dayRate: '14000', crewSize: '20-25', maxDepth: 3000, maxHookLoad: 280, rotaryTorque: 28000, pumpPressure: 4500,
        derrickCapacity: '400 t', mobilizationTime: '7-12 Tage', footprint: 'Klein' },
      { id: 't826', name: 'T-826', rigType: '800 HP CARDWELL',      hp: 800,  year: 1988, category: 'Kompakt',
        drawworks: 'Cardwell KB-660 (800 HP)', mudPumps: '1x Wirth TPK-800', topDrive: 'NOV TDS-3H',
        dayRate: '13000', crewSize: '20-25', maxDepth: 3000, maxHookLoad: 270, rotaryTorque: 27000, pumpPressure: 4500,
        derrickCapacity: '380 t', mobilizationTime: '7-10 Tage', footprint: 'Klein' },
      { id: 't853', name: 'T-853', rigType: '800 HP Highly Mobile',  hp: 800,  year: 1995, category: 'Kompakt',
        drawworks: 'National 80B (800 HP)', mudPumps: '1x Continental Emsco F-800', topDrive: 'Bentec TDS-150',
        dayRate: '14000', crewSize: '20-25', maxDepth: 3000, maxHookLoad: 280, rotaryTorque: 28000, pumpPressure: 4500,
        derrickCapacity: '400 t', mobilizationTime: '7-12 Tage', footprint: 'Klein' },
      { id: 't872', name: 'T-872', rigType: '800 HP Highly Mobile',  hp: 800,  year: 1992, category: 'Kompakt',
        drawworks: 'Ideco H-44 (800 HP)', mudPumps: '1x Wirth TPK-800', topDrive: 'Canrig 7005',
        dayRate: '14000', crewSize: '20-25', maxDepth: 3000, maxHookLoad: 280, rotaryTorque: 28000, pumpPressure: 4500,
        derrickCapacity: '400 t', mobilizationTime: '7-12 Tage', footprint: 'Klein' },
    ];

    await prisma.rig.createMany({
      data: rigFleet.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        maxDepth: r.maxDepth,
        maxHookLoad: r.maxHookLoad,
        footprint: r.footprint,
        rotaryTorque: r.rotaryTorque,
        pumpPressure: r.pumpPressure,
        drawworks: r.drawworks,
        mudPumps: r.mudPumps,
        topDrive: r.topDrive,
        derrickCapacity: r.derrickCapacity,
        crewSize: r.crewSize,
        mobilizationTime: r.mobilizationTime,
        dayRate: r.dayRate,
        description: `${r.rigType} Drilling Rig (${r.year})`,
        applications: JSON.stringify([]),
        technicalSpecs: JSON.stringify({ rigType: r.rigType, hpRating: `${r.hp} HP`, year: r.year }),
        region: 'Oman',
        contractStatus: 'idle',
        location: '',
        certifications: JSON.stringify([]),
        generalInfo: JSON.stringify([]),
        inspections: JSON.stringify([]),
        issues: JSON.stringify([]),
        improvements: JSON.stringify([]),
      })),
    });

    console.log(`✅ Created ${rigFleet.length} rigs from Equipment Master Database`);
  } else {
    console.log(`✅ Rigs already exist (${existingRigs} rigs found)`);
  }

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📝 Login credentials:');
  console.log('Admin:     admin@maintain.com / admin123');
  console.log('Manager:   thomas@maintain.com / manager123');
  console.log('User:      nils@maintain.com / nils123');
  console.log('\n👷 Rig Crew Login (all rigs):');
  console.log('Password for all crew: rig123');
  console.log(`\nRigs: ${rigs.join(', ')}`);
  console.log('Email pattern: <RIG>.<ROLE>@maintain.com (e.g. T-51.EL@maintain.com)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
