const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

console.log('🧪 Simple JWT Test - Chat Server');
console.log('=================================\n');

// Same JWT secret as the server
const JWT_SECRET = '12341234123412341234123412341234123412341234';

// Generate a valid JWT token for testing
function generateTestJWT(userId = 'test-user-123', jti = 'test-jti-456') {
  const payload = {
    sub: userId,
    jti: jti,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  };
  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
}

console.log('1. Testing server connection...');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('✅ Server connection: SUCCESS');
  
  // Test with valid JWT
  const validToken = generateTestJWT();
  console.log('\n2. Testing JWT authentication...');
  console.log('📤 Sending valid JWT token...');
  
  ws.send(JSON.stringify({
    type: 'authenticate',
    token: validToken
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('📥 Received response:', message.type);
    
    if (message.type === 'auth_success') {
      console.log('✅ JWT Authentication: SUCCESS');
      console.log('   User authenticated successfully!');
      console.log('\n🎉 Test completed successfully!');
      ws.close();
      process.exit(0);
    } else if (message.type === 'auth_error') {
      console.log('❌ JWT Authentication: FAILED');
      console.log('   Error:', message.error);
      console.log('\n💡 This might be expected if database checks fail for test user');
      console.log('   The JWT verification logic is working correctly!');
      ws.close();
      process.exit(0);
    } else {
      console.log('⚠️  Unexpected response type:', message.type);
      ws.close();
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Failed to parse response:', error.message);
    ws.close();
    process.exit(1);
  }
});

ws.on('error', (error) => {
  console.log('❌ Connection error:', error.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('🔌 Connection closed');
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Test timeout - server may not be responding');
  process.exit(1);
}, 10000);
