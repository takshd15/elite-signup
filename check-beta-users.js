#!/usr/bin/env node

/**
 * Check Beta Signup Users
 * Shows all 25 users who signed up for beta access
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

console.log('🎯 Checking Beta Signup Users...\n');

async function checkBetaUsers() {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('✅ Connected to database successfully\n');

    // Get all beta signup users
    console.log('📋 BETA SIGNUP USERS (pre_users_info):');
    console.log('=======================================');
    const betaUsersResult = await client.query(`
      SELECT 
        id,
        email,
        name
      FROM pre_users_info 
      ORDER BY id
    `);
    
    if (betaUsersResult.rows.length > 0) {
      console.log(`✅ Found ${betaUsersResult.rows.length} beta signup users:\n`);
      betaUsersResult.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}`);
        console.log(`      Name: ${user.name}`);
        console.log(`      Email: ${user.email}`);
        console.log('');
      });
    } else {
      console.log('❌ No beta signup users found');
    }

    // Check which beta users have converted to full users
    console.log('🔄 BETA TO FULL USER CONVERSION:');
    console.log('==================================');
    const conversionResult = await client.query(`
      SELECT 
        pui.id as beta_id,
        pui.email as beta_email,
        pui.name as beta_name,
        ua.user_id as full_user_id,
        ua.username as full_username,
        ua.role as user_role
      FROM pre_users_info pui
      LEFT JOIN users_auth ua ON LOWER(pui.email) = LOWER(ua.email)
      ORDER BY pui.id
    `);
    
    if (conversionResult.rows.length > 0) {
      console.log(`✅ Conversion status for ${conversionResult.rows.length} beta users:\n`);
      
      let converted = 0;
      let notConverted = 0;
      
      conversionResult.rows.forEach((user, index) => {
        const isConverted = user.full_user_id !== null;
        const status = isConverted ? '✅ CONVERTED' : '⏳ PENDING';
        
        console.log(`   ${index + 1}. ${status}`);
        console.log(`      Beta: ${user.beta_name} (${user.beta_email})`);
        
        if (isConverted) {
          console.log(`      Full User: ${user.full_username} (ID: ${user.full_user_id}, Role: ${user.user_role})`);
          converted++;
        } else {
          console.log(`      Full User: Not converted yet`);
          notConverted++;
        }
        console.log('');
      });
      
      console.log('📊 CONVERSION STATISTICS:');
      console.log('=========================');
      console.log(`📈 Total Beta Users: ${conversionResult.rows.length}`);
      console.log(`✅ Converted: ${converted}`);
      console.log(`⏳ Pending: ${notConverted}`);
      console.log(`📊 Conversion Rate: ${((converted / conversionResult.rows.length) * 100).toFixed(1)}%`);
    }

    // Show unique email domains
    console.log('\n📧 EMAIL DOMAIN ANALYSIS:');
    console.log('=========================');
    const domainResult = await client.query(`
      SELECT 
        SUBSTRING(email FROM '@(.*)$') as domain,
        COUNT(*) as count
      FROM pre_users_info 
      GROUP BY SUBSTRING(email FROM '@(.*)$')
      ORDER BY count DESC
    `);
    
    if (domainResult.rows.length > 0) {
      console.log('✅ Email domains used by beta users:');
      domainResult.rows.forEach((domain, index) => {
        console.log(`   ${index + 1}. ${domain.domain}: ${domain.count} users`);
      });
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

checkBetaUsers().catch(console.error);
