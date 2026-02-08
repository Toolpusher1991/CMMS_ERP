const API_URL = 'http://localhost:5137/api/shift-planner';

const plants = ['T208', 'T207', 'T46', 'T700'];

// Temporary admin user (replace with your login)
const loginData = {
  email: 'user@example.com',
  password: 'TestUser2025!',
};

async function generateRotations() {
  console.log('🔐 Logging in...\n');
  
  // Login to get token
  const loginRes = await fetch('http://localhost:5137/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginData),
  });
  
  if (!loginRes.ok) {
    console.error('❌ Login failed');
    return;
  }
  
  const { accessToken } = await loginRes.json() as any;
  console.log('✅ Login successful\n');
  
  // Generate rotations for each plant
  for (const plant of plants) {
    console.log(`\n🔄 Generating rotation for ${plant}...`);
    
    const res = await fetch(`${API_URL}/generate-rotation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        plant,
        startYear: 2026,
        startMonth: 2, // February
        endYear: 2026,
        endMonth: 8, // August
        workDays: 28,
        offDays: 28,
      }),
    });
    
    if (!res.ok) {
      console.error(`❌ Failed to generate rotation for ${plant}`);
      const error = await res.text();
      console.error(error);
      continue;
    }
    
    const result = await res.json() as any;
    console.log(`✅ ${plant}: Generated ${result.generated} assignments, created ${result.created}`);
  }
  
  console.log('\n\n🎉 All rotations generated!\n');
  console.log('📊 Summary:');
  console.log(`   Plants: ${plants.length}`);
  console.log('   Period: February - August 2026 (7 months)');
  console.log('   Rotation: 28 days on / 28 days off');
  console.log('   Personnel per plant: 18 (9 positions × 2 teams)');
}

generateRotations().catch(console.error);
