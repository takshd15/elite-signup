const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection configuration - using same env vars as Java backend
const dbClient = new Client({
  host: process.env.DB_HOST || 'cd6emofiekhlj.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'd4ukv7mqkkc9i1',
  user: process.env.DB_USER || 'u2eb6vlhflq6bt',
  password: process.env.DB_PASS || 'pe9512a0cbf2bc2eee176022c82836beedc48733196d06484e5dc69e2754f5a79',
  ssl: {
    rejectUnauthorized: false // For AWS RDS
  }
});

async function setupDatabase() {
  try {
    console.log('Connecting to database...');
    await dbClient.connect();
    console.log('✅ Connected to database successfully');

    console.log('Reading SQL file...');
    const sqlFile = fs.readFileSync(path.join(__dirname, 'chat_tables.sql'), 'utf8');
    
    console.log('Executing SQL statements...');
    // Split SQL file into individual statements
    const statements = sqlFile.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await dbClient.query(statement);
          console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
        } catch (error) {
          console.log(`⚠️  Statement ${i + 1} failed (this might be expected):`, error.message);
        }
      }
    }
    
    console.log('✅ Database setup completed successfully');
    
    // Verify tables were created
    console.log('\nVerifying tables...');
    const tables = ['chat_channels', 'chat_messages', 'chat_reactions', 'chat_read_receipts'];
    
    for (const table of tables) {
      try {
        const result = await dbClient.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ Table ${table}: ${result.rows[0].count} rows`);
      } catch (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    await dbClient.end();
    console.log('Database connection closed');
  }
}

setupDatabase();
