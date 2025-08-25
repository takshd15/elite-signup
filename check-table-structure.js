#!/usr/bin/env node

/**
 * Check Table Structure
 * Shows the actual columns in the users_auth table
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

console.log('🔍 Checking Table Structure...\n');

async function checkTableStructure() {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('✅ Connected to database successfully\n');

    // Check users_auth table structure
    console.log('📋 USERS_AUTH TABLE STRUCTURE:');
    console.log('===============================');
    const authStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users_auth'
      ORDER BY ordinal_position
    `);
    
    if (authStructure.rows.length > 0) {
      console.log(`✅ Found ${authStructure.rows.length} columns in users_auth:`);
      authStructure.rows.forEach((column, index) => {
        console.log(`   ${index + 1}. ${column.column_name} (${column.data_type})`);
        console.log(`      Nullable: ${column.is_nullable}`);
        console.log(`      Default: ${column.column_default || 'None'}`);
        console.log('');
      });
    } else {
      console.log('❌ No columns found in users_auth table');
    }

    // Check user_profile_info table structure
    console.log('📋 USER_PROFILE_INFO TABLE STRUCTURE:');
    console.log('=====================================');
    const profileStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_profile_info'
      ORDER BY ordinal_position
    `);
    
    if (profileStructure.rows.length > 0) {
      console.log(`✅ Found ${profileStructure.rows.length} columns in user_profile_info:`);
      profileStructure.rows.forEach((column, index) => {
        console.log(`   ${index + 1}. ${column.column_name} (${column.data_type})`);
        console.log(`      Nullable: ${column.is_nullable}`);
        console.log(`      Default: ${column.column_default || 'None'}`);
        console.log('');
      });
    } else {
      console.log('❌ No columns found in user_profile_info table');
    }

    // Get sample data from users_auth
    console.log('📋 SAMPLE DATA FROM USERS_AUTH:');
    console.log('================================');
    const sampleData = await client.query(`
      SELECT * FROM users_auth LIMIT 3
    `);
    
    if (sampleData.rows.length > 0) {
      console.log(`✅ Found ${sampleData.rows.length} sample records:`);
      sampleData.rows.forEach((row, index) => {
        console.log(`   Record ${index + 1}:`);
        Object.keys(row).forEach(key => {
          console.log(`      ${key}: ${row[key]}`);
        });
        console.log('');
      });
    } else {
      console.log('❌ No data found in users_auth table');
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

checkTableStructure().catch(console.error);
