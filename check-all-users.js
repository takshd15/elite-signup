#!/usr/bin/env node

/**
 * Check ALL Users in Database
 * Comprehensive check for all users including beta signups
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

console.log('👥 Checking ALL Users in Database...\n');

async function checkAllUsers() {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('✅ Connected to database successfully\n');

    // First, let's see all tables in the database
    console.log('📋 ALL TABLES IN DATABASE:');
    console.log('===========================');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`✅ Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name}`);
      });
      console.log('');
    }

    // Check for any table with 'user', 'beta', 'signup', 'waitlist' in the name
    console.log('🔍 SEARCHING FOR USER-RELATED TABLES:');
    console.log('=====================================');
    const userTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (
        table_name ILIKE '%user%' 
        OR table_name ILIKE '%beta%' 
        OR table_name ILIKE '%signup%' 
        OR table_name ILIKE '%waitlist%'
        OR table_name ILIKE '%email%'
        OR table_name ILIKE '%subscriber%'
      )
      ORDER BY table_name
    `);
    
    if (userTablesResult.rows.length > 0) {
      console.log(`✅ Found ${userTablesResult.rows.length} user-related tables:`);
      userTablesResult.rows.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name}`);
      });
      console.log('');
    }

    // Check each user-related table for data
    for (const tableRow of userTablesResult.rows) {
      const tableName = tableRow.table_name;
      console.log(`📋 TABLE: ${tableName.toUpperCase()}`);
      console.log('='.repeat(tableName.length + 8));
      
      try {
        // Get table structure
        const structureResult = await client.query(`
          SELECT column_name, data_type
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);
        
        console.log(`Columns: ${structureResult.rows.map(col => col.column_name).join(', ')}`);
        
        // Get sample data
        const dataResult = await client.query(`SELECT * FROM "${tableName}" LIMIT 5`);
        
        if (dataResult.rows.length > 0) {
          console.log(`✅ Found ${dataResult.rows.length} records (showing first 5):`);
          dataResult.rows.forEach((row, index) => {
            console.log(`   Record ${index + 1}:`);
            Object.keys(row).forEach(key => {
              const value = row[key];
              const displayValue = value && typeof value === 'string' && value.length > 50 
                ? value.substring(0, 50) + '...' 
                : value;
              console.log(`      ${key}: ${displayValue}`);
            });
            console.log('');
          });
        } else {
          console.log('❌ No data found in this table');
        }
        
        // Get total count
        const countResult = await client.query(`SELECT COUNT(*) as total FROM "${tableName}"`);
        console.log(`📊 Total records: ${countResult.rows[0].total}`);
        console.log('');
        
      } catch (error) {
        console.log(`❌ Error reading table ${tableName}: ${error.message}`);
        console.log('');
      }
    }

    // Check for any table that might contain email addresses
    console.log('📧 SEARCHING FOR EMAIL ADDRESSES:');
    console.log('==================================');
    const emailTablesResult = await client.query(`
      SELECT DISTINCT table_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND column_name ILIKE '%email%'
      ORDER BY table_name
    `);
    
    if (emailTablesResult.rows.length > 0) {
      console.log(`✅ Found ${emailTablesResult.rows.length} tables with email columns:`);
      for (const tableRow of emailTablesResult.rows) {
        const tableName = tableRow.table_name;
        console.log(`\n📧 Table: ${tableName}`);
        
        try {
          const emailResult = await client.query(`
            SELECT * FROM "${tableName}" 
            WHERE email IS NOT NULL 
            LIMIT 10
          `);
          
          if (emailResult.rows.length > 0) {
            console.log(`   Found ${emailResult.rows.length} records with emails:`);
            emailResult.rows.forEach((row, index) => {
              console.log(`   ${index + 1}. ${row.email || 'No email'}`);
            });
          }
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

checkAllUsers().catch(console.error);
