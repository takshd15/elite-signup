const { Client } = require('pg');

// Test the actual database credentials
const testConfigs = [
  {
         name: 'AWS RDS PostgreSQL',
     config: {
       host: 'cd6emofiekhlj.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com',
       port: 5432,
       database: 'd4ukv7mqkkc9i1',
       user: 'u2eb6vlhflq6bt',
       password: 'pe9512a0cbf2bc2eee176022c82836beedc48733196d06484e5dc69e2754f5a79',
       ssl: {
         rejectUnauthorized: false
       }
     }
  }
];

async function testConnection(config, name) {
  const client = new Client(config);
  
  try {
    console.log(`Testing ${name}...`);
    await client.connect();
    
    // Test if we can query the database
    const result = await client.query('SELECT current_database(), current_user');
    console.log(`✅ SUCCESS: ${name}`);
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   User: ${result.rows[0].current_user}`);
    
    // Check if our tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users_auth', 'user_profile_info')
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`   ✅ Found existing tables: ${tablesResult.rows.map(r => r.table_name).join(', ')}`);
    } else {
      console.log(`   ⚠️  No existing tables found`);
    }
    
    await client.end();
    return { success: true, config, name };
  } catch (error) {
    console.log(`❌ FAILED: ${name} - ${error.message}`);
    await client.end();
    return { success: false, config, name, error: error.message };
  }
}

async function main() {
  console.log('🔍 Testing PostgreSQL connections...\n');
  
  for (const testConfig of testConfigs) {
    await testConnection(testConfig.config, testConfig.name);
    console.log(''); // Empty line for readability
  }
  
  console.log('✅ Testing complete!');
}

main().catch(console.error);
