#!/usr/bin/env node

/**
 * Check Presigned Up Users in Database
 * Lists all users who have presigned up in the system
 */

const { Client } = require('pg');

// Database configuration
const DB_CONFIG = {
  host: 'cd6emofiekhlj.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com',
  port: 5432,
  database: 'd4ukv7mqkkc9i1',
  user: 'u2eb6vlhflq6bt',
  password: 'pe9512a0cbf2bc2eee176022c82836beedc48733196d06484e5dc69e2754f5a79',
  ssl: { rejectUnauthorized: false }
};

console.log('👥 Checking Presigned Up Users in Database...\n');

async function checkUsers() {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('✅ Connected to database successfully\n');

    // Check users_auth table
    console.log('📋 USERS_AUTH TABLE:');
    console.log('====================');
    const authResult = await client.query(`
      SELECT 
        user_id,
        username,
        email,
        role
      FROM users_auth 
      ORDER BY user_id DESC
    `);
    
    if (authResult.rows.length > 0) {
      console.log(`✅ Found ${authResult.rows.length} users in users_auth:`);
      authResult.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.user_id}`);
        console.log(`      Username: ${user.username}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Role: ${user.role}`);
        console.log('');
      });
    } else {
      console.log('❌ No users found in users_auth table');
    }

    // Check user_profile_info table
    console.log('📋 USER_PROFILE_INFO TABLE:');
    console.log('============================');
    const profileResult = await client.query(`
      SELECT 
        user_id_serial,
        first_name,
        last_name,
        bio,
        created_at,
        updated_at
      FROM user_profile_info 
      ORDER BY created_at DESC
    `);
    
    if (profileResult.rows.length > 0) {
      console.log(`✅ Found ${profileResult.rows.length} user profiles:`);
      profileResult.rows.forEach((profile, index) => {
        console.log(`   ${index + 1}. User ID: ${profile.user_id_serial}`);
        console.log(`      Name: ${profile.first_name} ${profile.last_name}`);
        console.log(`      Bio: ${profile.bio || 'No bio'}`);
        console.log(`      Created: ${new Date(profile.created_at).toLocaleString()}`);
        console.log(`      Updated: ${new Date(profile.updated_at).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('❌ No user profiles found in user_profile_info table');
    }

    // Check for users with both auth and profile info
    console.log('📋 COMPLETE USER PROFILES:');
    console.log('===========================');
    const completeResult = await client.query(`
      SELECT 
        ua.user_id,
        ua.username,
        ua.email,
        ua.role,
        upi.first_name,
        upi.last_name,
        upi.bio,
        upi.created_at as profile_created
      FROM users_auth ua
      LEFT JOIN user_profile_info upi ON ua.user_id = upi.user_id_serial
      ORDER BY ua.user_id DESC
    `);
    
    if (completeResult.rows.length > 0) {
      console.log(`✅ Found ${completeResult.rows.length} complete user profiles:`);
      completeResult.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. User ID: ${user.user_id}`);
        console.log(`      Username: ${user.username}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Full Name: ${user.first_name || 'N/A'} ${user.last_name || 'N/A'}`);
        console.log(`      Bio: ${user.bio || 'No bio'}`);
        console.log(`      Profile Created: ${user.profile_created ? new Date(user.profile_created).toLocaleString() : 'No profile'}`);
        console.log('');
      });
    } else {
      console.log('❌ No complete user profiles found');
    }

    // Check user statistics
    console.log('📊 USER STATISTICS:');
    console.log('===================');
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN upi.user_id_serial IS NOT NULL THEN 1 END) as users_with_profiles,
        COUNT(CASE WHEN upi.user_id_serial IS NULL THEN 1 END) as users_without_profiles,
        COUNT(CASE WHEN ua.role = 'PAID' THEN 1 END) as paid_users,
        COUNT(CASE WHEN ua.role = 'FREE' THEN 1 END) as free_users
      FROM users_auth ua
      LEFT JOIN user_profile_info upi ON ua.user_id = upi.user_id_serial
    `);
    
    if (statsResult.rows.length > 0) {
      const stats = statsResult.rows[0];
      console.log(`📈 Total Users: ${stats.total_users}`);
      console.log(`👤 Users with Profiles: ${stats.users_with_profiles}`);
      console.log(`👤 Users without Profiles: ${stats.users_without_profiles}`);
      console.log(`💰 Paid Users: ${stats.paid_users}`);
      console.log(`🆓 Free Users: ${stats.free_users}`);
    }

    // Check recent activity
    console.log('\n🕒 RECENT USER ACTIVITY:');
    console.log('========================');
    const recentResult = await client.query(`
      SELECT 
        ua.user_id,
        ua.username,
        ua.email,
        ua.role,
        upi.first_name,
        upi.last_name,
        upi.updated_at as last_activity
      FROM users_auth ua
      LEFT JOIN user_profile_info upi ON ua.user_id = upi.user_id_serial
      ORDER BY upi.updated_at DESC
      LIMIT 5
    `);
    
    if (recentResult.rows.length > 0) {
      console.log('✅ Recent user activity:');
      recentResult.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} (${user.first_name || 'N/A'} ${user.last_name || 'N/A'})`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Last Activity: ${user.last_activity ? new Date(user.last_activity).toLocaleString() : 'N/A'}`);
      });
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

checkUsers().catch(console.error);
