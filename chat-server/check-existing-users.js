const { Client } = require('pg');

// Database connection configuration
const dbClient = new Client({
  host: 'cd6emofiekhlj.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com',
  port: 5432,
  database: 'd4ukv7mqkkc9i1',
  user: 'u2eb6vlhflq6bt',
  password: 'pe9512a0cbf2bc2eee176022c82836beedc48733196d06484e5dc69e2754f5a79',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkExistingUsers() {
  try {
    console.log('🔍 Connecting to database...');
    await dbClient.connect();
    console.log('✅ Connected to database successfully');

    // Check users_auth table
    console.log('\n📋 Checking users_auth table...');
    const usersResult = await dbClient.query(`
      SELECT user_id, username, email, role 
      FROM users_auth 
      ORDER BY user_id
    `);

    if (usersResult.rows.length > 0) {
      console.log(`✅ Found ${usersResult.rows.length} users:`);
      usersResult.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.user_id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
      });
    } else {
      console.log('⚠️  No users found in users_auth table');
    }

    // Check user_profile_info table
    console.log('\n📋 Checking user_profile_info table...');
    const profileResult = await dbClient.query(`
      SELECT user_id_serial, first_name, last_name, bio
      FROM user_profile_info 
      ORDER BY user_id_serial
    `);

    if (profileResult.rows.length > 0) {
      console.log(`✅ Found ${profileResult.rows.length} user profiles:`);
      profileResult.rows.forEach((profile, index) => {
        console.log(`   ${index + 1}. User ID: ${profile.user_id_serial}, Name: ${profile.first_name} ${profile.last_name}, Bio: ${profile.bio || 'N/A'}`);
      });
    } else {
      console.log('⚠️  No user profiles found in user_profile_info table');
    }

    // Check pre_users_info table
    console.log('\n📋 Checking pre_users_info table...');
    const preUsersResult = await dbClient.query(`
      SELECT name, email
      FROM pre_users_info 
      ORDER BY name
    `);

    if (preUsersResult.rows.length > 0) {
      console.log(`✅ Found ${preUsersResult.rows.length} pre-registered users:`);
      preUsersResult.rows.forEach((preUser, index) => {
        console.log(`   ${index + 1}. Name: ${preUser.name}, Email: ${preUser.email}`);
      });
    } else {
      console.log('⚠️  No pre-registered users found in pre_users_info table');
    }

    console.log('\n🎯 Chat Testing Recommendations:');
    if (usersResult.rows.length > 0) {
      console.log('✅ You can test chat with existing users!');
      console.log('   Use these user IDs in your chat tests:');
      usersResult.rows.slice(0, 3).forEach(user => {
        console.log(`   - User ID: ${user.user_id} (${user.username})`);
      });
    } else {
      console.log('⚠️  No users found. You may need to:');
      console.log('   1. Start the Java backend');
      console.log('   2. Register some users through the signup process');
      console.log('   3. Or create test users directly in the database');
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await dbClient.end();
    console.log('\n🔌 Database connection closed');
  }
}

checkExistingUsers().catch(console.error);
