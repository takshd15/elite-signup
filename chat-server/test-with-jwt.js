const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

console.log('🧪 Chat Server Test with JWT Authentication');
console.log('============================================\n');

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

// Test results
let testsPassed = 0;
let testsFailed = 0;

function logTest(testName, passed, details = '') {
  if (passed) {
    testsPassed++;
    console.log(`✅ ${testName}: PASSED`);
  } else {
    testsFailed++;
    console.log(`❌ ${testName}: FAILED - ${details}`);
  }
}

async function testServerConnection() {
  return new Promise((resolve) => {
    console.log('1. Testing server connection...');
    
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.on('open', () => {
      logTest('Server Connection', true);
      ws.close();
      resolve(true);
    });
    
    ws.on('error', (error) => {
      logTest('Server Connection', false, error.message);
      resolve(false);
    });
    
    setTimeout(() => {
      logTest('Server Connection', false, 'Timeout');
      resolve(false);
    }, 5000);
  });
}

async function testJWTAuthentication() {
  return new Promise((resolve) => {
    console.log('\n2. Testing JWT authentication...');
    
    const ws = new WebSocket('ws://localhost:3001');
    const validToken = generateTestJWT();
    
    ws.on('open', () => {
      console.log('📤 Sending JWT token for authentication...');
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
          logTest('JWT Authentication', true);
          console.log('   User authenticated:', message.user?.name || 'Unknown');
        } else if (message.type === 'auth_error') {
          logTest('JWT Authentication', false, message.error);
        } else {
          logTest('JWT Authentication', false, `Unexpected response: ${message.type}`);
        }
        
        ws.close();
        resolve(true);
      } catch (error) {
        logTest('JWT Authentication', false, 'Invalid JSON response');
        ws.close();
        resolve(false);
      }
    });
    
    ws.on('error', (error) => {
      logTest('JWT Authentication', false, error.message);
      resolve(false);
    });
    
    setTimeout(() => {
      logTest('JWT Authentication', false, 'Timeout');
      resolve(false);
    }, 10000);
  });
}

async function testInvalidJWT() {
  return new Promise((resolve) => {
    console.log('\n3. Testing invalid JWT rejection...');
    
    const ws = new WebSocket('ws://localhost:3001');
    const invalidToken = 'invalid.jwt.token';
    
    ws.on('open', () => {
      console.log('📤 Sending invalid JWT token...');
      ws.send(JSON.stringify({
        type: 'authenticate',
        token: invalidToken
      }));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('📥 Received response:', message.type);
        
        if (message.type === 'auth_error') {
          logTest('Invalid JWT Rejection', true);
        } else {
          logTest('Invalid JWT Rejection', false, 'Should have rejected invalid token');
        }
        
        ws.close();
        resolve(true);
      } catch (error) {
        logTest('Invalid JWT Rejection', false, 'Invalid JSON response');
        ws.close();
        resolve(false);
      }
    });
    
    setTimeout(() => {
      logTest('Invalid JWT Rejection', false, 'Timeout');
      resolve(false);
    }, 5000);
  });
}

async function testMessageSending() {
  return new Promise((resolve) => {
    console.log('\n4. Testing message sending...');
    
    const ws = new WebSocket('ws://localhost:3001');
    const validToken = generateTestJWT();
    let authenticated = false;
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'authenticate',
        token: validToken
      }));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        
        if (message.type === 'auth_success' && !authenticated) {
          authenticated = true;
          console.log('📤 Sending test message...');
          ws.send(JSON.stringify({
            type: 'message',
            content: 'Hello from test!',
            channel: 'general'
          }));
        } else if (message.type === 'message_sent' && authenticated) {
          logTest('Message Sending', true);
          console.log('   Message ID:', message.messageId);
          ws.close();
          resolve(true);
        } else if (message.type === 'error' && authenticated) {
          logTest('Message Sending', false, message.error);
          ws.close();
          resolve(false);
        }
      } catch (error) {
        logTest('Message Sending', false, 'Invalid JSON response');
        ws.close();
        resolve(false);
      }
    });
    
    setTimeout(() => {
      logTest('Message Sending', false, 'Timeout');
      resolve(false);
    }, 15000);
  });
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive chat server tests...\n');
  
  // Run tests sequentially
  await testServerConnection();
  await testJWTAuthentication();
  await testInvalidJWT();
  await testMessageSending();
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log(`Total Tests: ${testsPassed + testsFailed}`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Chat server is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check server logs for details.');
  }
  
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run the tests
runAllTests().catch(error => {
  console.error('Test execution error:', error);
  process.exit(1);
});
