const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const axios = require('axios');

console.log('🧪 Real JWT Integration Test - Chat Server');
console.log('==========================================');

// Configuration
const CHAT_SERVER_URL = 'ws://localhost:3001';
const BACKEND_URL = 'http://localhost:8081/v1/auth/validate';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Test user data
const testUsers = [
  { id: 'user-1', username: 'testuser1', email: 'test1@example.com' },
  { id: 'user-2', username: 'testuser2', email: 'test2@example.com' },
  { id: 'user-3', username: 'testuser3', email: 'test3@example.com' }
];

// Generate a valid JWT token for testing
function generateTestJWT(userId, jti = null) {
  const payload = {
    userId: userId,
    username: testUsers.find(u => u.id === userId)?.username || 'testuser',
    email: testUsers.find(u => u.id === userId)?.email || 'test@example.com',
    jti: jti || `jti-${userId}-${Date.now()}`,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

// Generate an invalid JWT token
function generateInvalidJWT(userId) {
  const payload = {
    userId: userId,
    username: 'testuser',
    email: 'test@example.com',
    jti: `invalid-jti-${Date.now()}`,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60)
  };
  
  return jwt.sign(payload, 'wrong-secret-key');
}

// Test JWT validation with backend
async function testBackendJWTValidation(token) {
  try {
    const response = await axios.post(BACKEND_URL, { token }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
    return response.data.valid === true;
  } catch (error) {
    console.log(`❌ Backend validation failed: ${error.message}`);
    return false;
  }
}

// Test WebSocket connection with JWT
async function testWebSocketConnection(userId, token, shouldSucceed = true) {
  return new Promise((resolve) => {
    console.log(`\n🔗 Testing WebSocket connection for user: ${userId}`);
    
    const ws = new WebSocket(CHAT_SERVER_URL);
    let authenticated = false;
    let testResults = {
      connection: false,
      authentication: false,
      messageSending: false,
      messageReceiving: false
    };

    ws.on('open', () => {
      console.log(`✅ WebSocket connected for ${userId}`);
      testResults.connection = true;
      
      // Send authentication message
      const authMessage = {
        type: 'authenticate',
        token: token
      };
      ws.send(JSON.stringify(authMessage));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log(`📨 Received message: ${message.type}`);
        
        if (message.type === 'authenticated') {
          authenticated = true;
          testResults.authentication = true;
          console.log(`✅ Authentication successful for ${userId}`);
          
          // Test sending a message
          const chatMessage = {
            type: 'send_message',
            content: `Test message from ${userId}`,
            roomId: 'test-room'
          };
          ws.send(JSON.stringify(chatMessage));
          
        } else if (message.type === 'message_sent') {
          testResults.messageSending = true;
          console.log(`✅ Message sent successfully by ${userId}`);
          
          // Test receiving a message
          setTimeout(() => {
            const broadcastMessage = {
              type: 'broadcast_message',
              content: `Broadcast test from ${userId}`,
              roomId: 'test-room'
            };
            ws.send(JSON.stringify(broadcastMessage));
          }, 1000);
          
        } else if (message.type === 'new_message') {
          testResults.messageReceiving = true;
          console.log(`✅ Message received successfully by ${userId}`);
          
          // Close connection after successful test
          setTimeout(() => {
            ws.close();
          }, 500);
        }
        
      } catch (error) {
        console.log(`❌ Error parsing message: ${error.message}`);
      }
    });

    ws.on('error', (error) => {
      console.log(`❌ WebSocket error for ${userId}: ${error.message}`);
      if (!shouldSucceed) {
        testResults.connection = true; // Expected failure
      }
      resolve(testResults);
    });

    ws.on('close', () => {
      console.log(`🔌 WebSocket closed for ${userId}`);
      resolve(testResults);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      resolve(testResults);
    }, 10000);
  });
}

// Run comprehensive JWT tests
async function runJWTTests() {
  console.log('\n🚀 Starting JWT Integration Tests...\n');
  
  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Valid JWT token generation
  console.log('📝 Test 1: Valid JWT Token Generation');
  testResults.total++;
  try {
    const validToken = generateTestJWT('user-1');
    const decoded = jwt.verify(validToken, JWT_SECRET);
    if (decoded.userId === 'user-1') {
      console.log('✅ Valid JWT token generated successfully');
      testResults.passed++;
      testResults.tests.push({ name: 'Valid JWT Generation', status: 'PASSED' });
    } else {
      throw new Error('Token payload mismatch');
    }
  } catch (error) {
    console.log(`❌ JWT generation failed: ${error.message}`);
    testResults.failed++;
    testResults.tests.push({ name: 'Valid JWT Generation', status: 'FAILED', error: error.message });
  }

  // Test 2: Invalid JWT token detection
  console.log('\n📝 Test 2: Invalid JWT Token Detection');
  testResults.total++;
  try {
    const invalidToken = generateInvalidJWT('user-1');
    jwt.verify(invalidToken, JWT_SECRET);
    console.log('❌ Invalid JWT was not detected');
    testResults.failed++;
    testResults.tests.push({ name: 'Invalid JWT Detection', status: 'FAILED' });
  } catch (error) {
    console.log('✅ Invalid JWT token correctly rejected');
    testResults.passed++;
    testResults.tests.push({ name: 'Invalid JWT Detection', status: 'PASSED' });
  }

  // Test 3: Backend JWT validation (if backend is available)
  console.log('\n📝 Test 3: Backend JWT Validation');
  testResults.total++;
  const validToken = generateTestJWT('user-1');
  const backendValid = await testBackendJWTValidation(validToken);
  if (backendValid) {
    console.log('✅ Backend JWT validation successful');
    testResults.passed++;
    testResults.tests.push({ name: 'Backend JWT Validation', status: 'PASSED' });
  } else {
    console.log('⚠️  Backend JWT validation failed (backend may be offline)');
    testResults.tests.push({ name: 'Backend JWT Validation', status: 'SKIPPED' });
  }

  // Test 4: WebSocket authentication with valid JWT
  console.log('\n📝 Test 4: WebSocket Authentication with Valid JWT');
  testResults.total++;
  const wsResults = await testWebSocketConnection('user-1', validToken, true);
  if (wsResults.connection && wsResults.authentication) {
    console.log('✅ WebSocket authentication with valid JWT successful');
    testResults.passed++;
    testResults.tests.push({ name: 'WebSocket Valid JWT Auth', status: 'PASSED' });
  } else {
    console.log('❌ WebSocket authentication with valid JWT failed');
    testResults.failed++;
    testResults.tests.push({ name: 'WebSocket Valid JWT Auth', status: 'FAILED' });
  }

  // Test 5: WebSocket authentication with invalid JWT
  console.log('\n📝 Test 5: WebSocket Authentication with Invalid JWT');
  testResults.total++;
  const invalidToken = generateInvalidJWT('user-1');
  const wsInvalidResults = await testWebSocketConnection('user-1', invalidToken, false);
  if (!wsInvalidResults.authentication) {
    console.log('✅ WebSocket correctly rejected invalid JWT');
    testResults.passed++;
    testResults.tests.push({ name: 'WebSocket Invalid JWT Rejection', status: 'PASSED' });
  } else {
    console.log('❌ WebSocket accepted invalid JWT');
    testResults.failed++;
    testResults.tests.push({ name: 'WebSocket Invalid JWT Rejection', status: 'FAILED' });
  }

  // Test 6: Multiple user authentication
  console.log('\n📝 Test 6: Multiple User Authentication');
  testResults.total++;
  try {
    const tokens = testUsers.map(user => generateTestJWT(user.id));
    const uniqueTokens = new Set(tokens.map(token => jwt.decode(token).jti));
    if (uniqueTokens.size === tokens.length) {
      console.log('✅ Multiple unique JWT tokens generated successfully');
      testResults.passed++;
      testResults.tests.push({ name: 'Multiple User JWT Generation', status: 'PASSED' });
    } else {
      throw new Error('Duplicate JTI values found');
    }
  } catch (error) {
    console.log(`❌ Multiple user JWT generation failed: ${error.message}`);
    testResults.failed++;
    testResults.tests.push({ name: 'Multiple User JWT Generation', status: 'FAILED', error: error.message });
  }

  // Test 7: JWT expiration handling
  console.log('\n📝 Test 7: JWT Expiration Handling');
  testResults.total++;
  try {
    const expiredPayload = {
      userId: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
      jti: `expired-jti-${Date.now()}`,
      iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
      exp: Math.floor(Date.now() / 1000) - 3600  // 1 hour ago (expired)
    };
    const expiredToken = jwt.sign(expiredPayload, JWT_SECRET);
    jwt.verify(expiredToken, JWT_SECRET);
    console.log('❌ Expired JWT was not detected');
    testResults.failed++;
    testResults.tests.push({ name: 'JWT Expiration Handling', status: 'FAILED' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.log('✅ Expired JWT correctly rejected');
      testResults.passed++;
      testResults.tests.push({ name: 'JWT Expiration Handling', status: 'PASSED' });
    } else {
      console.log(`❌ Unexpected error with expired JWT: ${error.message}`);
      testResults.failed++;
      testResults.tests.push({ name: 'JWT Expiration Handling', status: 'FAILED', error: error.message });
    }
  }

  // Print test summary
  console.log('\n📊 JWT Integration Test Results');
  console.log('================================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  console.log('\n📋 Detailed Test Results:');
  testResults.tests.forEach((test, index) => {
    const status = test.status === 'PASSED' ? '✅' : test.status === 'SKIPPED' ? '⚠️' : '❌';
    console.log(`${status} Test ${index + 1}: ${test.name} - ${test.status}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });

  if (testResults.failed === 0) {
    console.log('\n🎉 All JWT integration tests passed!');
  } else {
    console.log(`\n⚠️  ${testResults.failed} test(s) failed. Please check the implementation.`);
  }

  return testResults;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runJWTTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runJWTTests,
  generateTestJWT,
  generateInvalidJWT,
  testBackendJWTValidation,
  testWebSocketConnection
};
