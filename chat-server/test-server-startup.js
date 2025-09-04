// Test server startup to identify issues
require('dotenv').config();

console.log('🧪 Testing Server Startup...\n');

// Test 1: Check environment variables
console.log('1️⃣ Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('REDIS_URL:', process.env.REDIS_URL || 'NOT SET');
console.log('DB_HOST:', process.env.DB_HOST ? 'SET' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');

// Test 2: Check Redis configuration
console.log('\n2️⃣ Redis Configuration:');
try {
  const { initializeRedis } = require('./config/redis');
  console.log('✅ Redis module loaded successfully');
  
  // Test Redis initialization
  initializeRedis().then(success => {
    console.log('Redis initialization result:', success);
  }).catch(error => {
    console.log('Redis initialization error:', error.message);
  });
} catch (error) {
  console.log('❌ Redis module error:', error.message);
}

// Test 3: Check database configuration
console.log('\n3️⃣ Database Configuration:');
try {
  const { initializeDatabase } = require('./config/database');
  console.log('✅ Database module loaded successfully');
  
  // Test database initialization
  initializeDatabase().then(success => {
    console.log('Database initialization result:', success);
  }).catch(error => {
    console.log('Database initialization error:', error.message);
  });
} catch (error) {
  console.log('❌ Database module error:', error.message);
}

// Test 4: Check server module
console.log('\n4️⃣ Server Module:');
try {
  require('./server.js');
  console.log('✅ Server module loaded successfully');
} catch (error) {
  console.log('❌ Server module error:', error.message);
  console.log('Error stack:', error.stack);
}

console.log('\n✅ Startup test completed');
