// Enhanced database connection pool
const { Pool } = require('pg');

const dbPool = new Pool({
  host: process.env.DB_HOST || 'cd6emofiekhlj.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'd4ukv7mqkkc9i1',
  user: process.env.DB_USER || 'u2eb6vlhflq6bt',
  password: process.env.DB_PASS || 'pe9512a0cbf2bc2eee176022c82836beedc48733196d06484e5dc69e2754f5a79',
  ssl: {
    rejectUnauthorized: false
  },
  // Connection pool settings - optimized for high concurrency
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 200, // Increased from 50 to 200 (4x improvement)
  min: parseInt(process.env.DB_MIN_CONNECTIONS) || 10,  // Increased from 5 to 10 (2x improvement)
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
  maxUses: parseInt(process.env.DB_MAX_USES) || 7500,
  allowExitOnIdle: true,
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000
});

// Initialize database pool
let dbConnected = false;

async function initializeDatabase() {
  try {
    const client = await dbPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    dbConnected = true;
    
    // Create private messaging tables if they don't exist
    try {
      const fs = require('fs');
      const path = require('path');
      const sqlFile = fs.readFileSync(path.join(__dirname, '..', 'private_messaging_tables.sql'), 'utf8');
      
      // Better SQL parsing that handles functions with semicolons
      const statements = [];
      let currentStatement = '';
      let inFunction = false;
      let dollarQuoteLevel = 0;
      
      const lines = sqlFile.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip comments and empty lines
        if (trimmedLine.startsWith('--') || trimmedLine === '') {
          continue;
        }
        
        // Check for dollar quoting ($$)
        const dollarQuotes = (line.match(/\$\$/g) || []).length;
        if (dollarQuotes > 0) {
          dollarQuoteLevel += dollarQuotes;
          inFunction = dollarQuoteLevel % 2 === 1;
        }
        
        currentStatement += line + '\n';
        
        // Only split on semicolons if we're not inside a function
        if (line.includes(';') && !inFunction) {
          const cleanStatement = currentStatement.trim();
          if (cleanStatement) {
            statements.push(cleanStatement);
          }
          currentStatement = '';
        }
      }
      
      // Add any remaining statement
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await dbPool.query(statement);
          } catch (sqlError) {
            console.warn(`SQL statement failed (might already exist): ${sqlError.message}`);
          }
        }
      }
      
      console.log('Private messaging tables and indexes setup completed');
      
    } catch (error) {
      console.error('Error reading SQL file:', error);
    }
    
    return true;
  } catch (error) {
    console.error('Database pool test failed:', error.message);
    dbConnected = false;
    return false;
  }
}

// Function to get current database connection status
function getDbConnected() {
  return dbConnected;
}

module.exports = {
  dbPool,
  dbConnected,
  initializeDatabase,
  getDbConnected
};
