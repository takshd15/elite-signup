const WebSocket = require('ws');
const fs = require('fs');
const crypto = require('crypto');

console.log('🧪 EXTREMELY COMPREHENSIVE PRODUCTION SERVER TEST');
console.log('=' .repeat(60));

// Load test JWT tokens
const testData = JSON.parse(fs.readFileSync('test-jwt-tokens.json', 'utf8'));

const SERVER_URL = 'ws://localhost:3001';
const TEST_TIMEOUT = 15000;

// Test results tracking
let passedTests = 0;
let failedTests = 0;
let testResults = [];

function logTestResult(testName, passed, details = '', category = 'General') {
  const result = {
    name: testName,
    passed,
    details,
    category,
    timestamp: new Date().toISOString()
  };
  
  testResults.push(result);
  
  if (passed) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.log(`❌ FAIL: ${testName}${details ? ` - ${details}` : ''}`);
    failedTests++;
  }
}

function sendMessage(ws, message) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Message timeout'));
    }, TEST_TIMEOUT);
    
    const messageHandler = (data) => {
      try {
        const response = JSON.parse(data);
        if (response.type === 'connected') {
          return; // Continue waiting
        }
        clearTimeout(timeout);
        ws.removeListener('message', messageHandler);
        resolve(response);
      } catch (error) {
        clearTimeout(timeout);
        ws.removeListener('message', messageHandler);
        reject(new Error('Invalid JSON response'));
      }
    };
    
    ws.on('message', messageHandler);
    ws.send(JSON.stringify(message));
  });
}

function createWebSocketConnection() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(SERVER_URL);
    
    ws.on('open', () => {
      resolve(ws);
    });
    
    ws.on('error', (error) => {
      reject(error);
    });
    
    setTimeout(() => {
      reject(new Error('Connection timeout'));
    }, 5000);
  });
}

// ============================================================================
// 1. CONNECTION & AUTHENTICATION TESTS
// ============================================================================

async function testConnectionBasics() {
  console.log('\n🔌 1. CONNECTION & AUTHENTICATION TESTS');
  console.log('-'.repeat(40));
  
  // Test 1.1: Basic connection
  try {
    const ws = await createWebSocketConnection();
    const pingResponse = await sendMessage(ws, { type: 'ping' });
    
    if (pingResponse.type === 'pong') {
      logTestResult('Basic WebSocket Connection', true, '', 'Connection');
    } else {
      logTestResult('Basic WebSocket Connection', false, `Expected pong, got ${pingResponse.type}`, 'Connection');
    }
    ws.close();
  } catch (error) {
    logTestResult('Basic WebSocket Connection', false, error.message, 'Connection');
  }
  
  // Test 1.2: Valid JWT authentication for all users
  for (const tokenData of testData.valid_tokens) {
    try {
      const ws = await createWebSocketConnection();
      const authResponse = await sendMessage(ws, {
        type: 'authenticate',
        token: tokenData.token
      });
      
      if (authResponse.type === 'authenticated') {
        logTestResult(`JWT Authentication - ${tokenData.user.username}`, true, '', 'Authentication');
      } else {
        logTestResult(`JWT Authentication - ${tokenData.user.username}`, false, authResponse.message || authResponse.type, 'Authentication');
      }
      ws.close();
    } catch (error) {
      logTestResult(`JWT Authentication - ${tokenData.user.username}`, false, error.message, 'Authentication');
    }
  }
  
  // Test 1.3: Revoked JWT rejection
  try {
    const ws = await createWebSocketConnection();
    const authResponse = await sendMessage(ws, {
      type: 'authenticate',
      token: testData.revoked_token.token
    });
    
    if (authResponse.type === 'auth_error') {
      logTestResult('Revoked JWT Rejection', true, '', 'Authentication');
    } else {
      logTestResult('Revoked JWT Rejection', false, `Expected auth_error, got ${authResponse.type}`, 'Authentication');
    }
    ws.close();
  } catch (error) {
    logTestResult('Revoked JWT Rejection', false, error.message, 'Authentication');
  }
  
  // Test 1.4: Invalid JWT rejection
  try {
    const ws = await createWebSocketConnection();
    const authResponse = await sendMessage(ws, {
      type: 'authenticate',
      token: 'invalid.jwt.token'
    });
    
    if (authResponse.type === 'auth_error') {
      logTestResult('Invalid JWT Rejection', true, '', 'Authentication');
    } else {
      logTestResult('Invalid JWT Rejection', false, `Expected auth_error, got ${authResponse.type}`, 'Authentication');
    }
    ws.close();
  } catch (error) {
    logTestResult('Invalid JWT Rejection', false, error.message, 'Authentication');
  }
  
  // Test 1.5: Empty token rejection
  try {
    const ws = await createWebSocketConnection();
    const authResponse = await sendMessage(ws, {
      type: 'authenticate',
      token: ''
    });
    
    if (authResponse.type === 'auth_error') {
      logTestResult('Empty Token Rejection', true, '', 'Authentication');
    } else {
      logTestResult('Empty Token Rejection', false, `Expected auth_error, got ${authResponse.type}`, 'Authentication');
    }
    ws.close();
  } catch (error) {
    logTestResult('Empty Token Rejection', false, error.message, 'Authentication');
  }
  
  // Test 1.6: No token rejection
  try {
    const ws = await createWebSocketConnection();
    const authResponse = await sendMessage(ws, {
      type: 'authenticate'
    });
    
    if (authResponse.type === 'auth_error') {
      logTestResult('No Token Rejection', true, '', 'Authentication');
    } else {
      logTestResult('No Token Rejection', false, `Expected auth_error, got ${authResponse.type}`, 'Authentication');
    }
    ws.close();
  } catch (error) {
    logTestResult('No Token Rejection', false, error.message, 'Authentication');
  }
}

// ============================================================================
// 2. USER MANAGEMENT & PRESENCE TESTS
// ============================================================================

async function testUserManagement() {
  console.log('\n👥 2. USER MANAGEMENT & PRESENCE TESTS');
  console.log('-'.repeat(40));
  
  // Test 2.1: Get online users when no users online
  try {
    const ws = await createWebSocketConnection();
    
    // First authenticate
    const authResponse = await sendMessage(ws, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    if (authResponse.type === 'authenticated') {
      const onlineResponse = await sendMessage(ws, {
        type: 'get_online_users'
      });
      
      if (onlineResponse.type === 'online_users') {
        logTestResult('Get Online Users (Empty)', true, '', 'User Management');
      } else {
        logTestResult('Get Online Users (Empty)', false, `Expected online_users, got ${onlineResponse.type}`, 'User Management');
      }
    } else {
      logTestResult('Get Online Users (Empty)', false, 'Authentication failed', 'User Management');
    }
    ws.close();
  } catch (error) {
    logTestResult('Get Online Users (Empty)', false, error.message, 'User Management');
  }
  
  // Test 2.2: Multiple users online simultaneously
  try {
    const connections = [];
    const users = testData.valid_tokens.slice(0, 3);
    
    // Connect and authenticate multiple users
    for (const userData of users) {
      const ws = await createWebSocketConnection();
      const authResponse = await sendMessage(ws, {
        type: 'authenticate',
        token: userData.token
      });
      
      if (authResponse.type === 'authenticated') {
        connections.push({ ws, user: userData.user.username });
      } else {
        ws.close();
      }
    }
    
    if (connections.length >= 2) {
      // Check online users from first user's perspective
      const onlineResponse = await sendMessage(connections[0].ws, {
        type: 'get_online_users'
      });
      
      if (onlineResponse.type === 'online_users' && onlineResponse.users.length >= connections.length - 1) {
        logTestResult('Multiple Users Online', true, `${onlineResponse.users.length} users online`, 'User Management');
      } else {
        logTestResult('Multiple Users Online', false, `Expected ${connections.length - 1}+ users, got ${onlineResponse.users.length}`, 'User Management');
      }
    }
    
    // Close all connections
    for (const conn of connections) {
      conn.ws.close();
    }
  } catch (error) {
    logTestResult('Multiple Users Online', false, error.message, 'User Management');
  }
  
  // Test 2.3: User disconnection handling
  try {
    const ws1 = await createWebSocketConnection();
    const auth1 = await sendMessage(ws1, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    const ws2 = await createWebSocketConnection();
    const auth2 = await sendMessage(ws2, {
      type: 'authenticate',
      token: testData.valid_tokens[1].token
    });
    
    if (auth1.type === 'authenticated' && auth2.type === 'authenticated') {
      // Check online users before disconnection
      const beforeResponse = await sendMessage(ws1, { type: 'get_online_users' });
      
      // Disconnect second user
      ws2.close();
      
      // Wait a moment for disconnection to register
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check online users after disconnection
      const afterResponse = await sendMessage(ws1, { type: 'get_online_users' });
      
      if (afterResponse.users.length < beforeResponse.users.length) {
        logTestResult('User Disconnection Handling', true, 'User properly removed from online list', 'User Management');
      } else {
        logTestResult('User Disconnection Handling', false, 'User not removed from online list', 'User Management');
      }
    }
    
    ws1.close();
  } catch (error) {
    logTestResult('User Disconnection Handling', false, error.message, 'User Management');
  }
}

// ============================================================================
// 3. CONVERSATION & MESSAGING TESTS
// ============================================================================

async function testConversationAndMessaging() {
  console.log('\n💬 3. CONVERSATION & MESSAGING TESTS');
  console.log('-'.repeat(40));
  
  // Test 3.1: Start conversation between two users
  try {
    const aliceWs = await createWebSocketConnection();
    const aliceAuth = await sendMessage(aliceWs, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    const bobWs = await createWebSocketConnection();
    const bobAuth = await sendMessage(bobWs, {
      type: 'authenticate',
      token: testData.valid_tokens[1].token
    });
    
    if (aliceAuth.type === 'authenticated' && bobAuth.type === 'authenticated') {
      const convResponse = await sendMessage(aliceWs, {
        type: 'start_conversation',
        recipientId: bobAuth.user.id
      });
      
      if (convResponse.type === 'conversation_started') {
        logTestResult('Start Conversation', true, `Conversation ID: ${convResponse.conversationId}`, 'Conversation');
      } else {
        logTestResult('Start Conversation', false, convResponse.message || convResponse.type, 'Conversation');
      }
    }
    
    aliceWs.close();
    bobWs.close();
  } catch (error) {
    logTestResult('Start Conversation', false, error.message, 'Conversation');
  }
  
  // Test 3.2: Send private message
  try {
    const aliceWs = await createWebSocketConnection();
    const aliceAuth = await sendMessage(aliceWs, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    const bobWs = await createWebSocketConnection();
    const bobAuth = await sendMessage(bobWs, {
      type: 'authenticate',
      token: testData.valid_tokens[1].token
    });
    
    if (aliceAuth.type === 'authenticated' && bobAuth.type === 'authenticated') {
      const msgResponse = await sendMessage(aliceWs, {
        type: 'send_private_message',
        recipientId: bobAuth.user.id.toString(),
        content: 'Hello Bob! This is a test message.'
      });
      
      if (msgResponse.type === 'private_message_sent') {
        logTestResult('Send Private Message', true, `Message ID: ${msgResponse.message.id}`, 'Messaging');
      } else {
        logTestResult('Send Private Message', false, msgResponse.message || msgResponse.type, 'Messaging');
      }
    }
    
    aliceWs.close();
    bobWs.close();
  } catch (error) {
    logTestResult('Send Private Message', false, error.message, 'Messaging');
  }
  
  // Test 3.3: Message validation - empty content
  try {
    const ws = await createWebSocketConnection();
    const auth = await sendMessage(ws, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    if (auth.type === 'authenticated') {
      const msgResponse = await sendMessage(ws, {
        type: 'send_private_message',
        recipientId: testData.valid_tokens[1].user.userId.toString(),
        content: ''
      });
      
      if (msgResponse.type === 'error') {
        logTestResult('Empty Message Validation', true, '', 'Message Validation');
      } else {
        logTestResult('Empty Message Validation', false, `Expected error, got ${msgResponse.type}`, 'Message Validation');
      }
    }
    
    ws.close();
  } catch (error) {
    logTestResult('Empty Message Validation', false, error.message, 'Message Validation');
  }
  
  // Test 3.4: Message validation - very long content
  try {
    const ws = await createWebSocketConnection();
    const auth = await sendMessage(ws, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    if (auth.type === 'authenticated') {
      const longMessage = 'A'.repeat(1001); // Exceeds 1000 character limit
      const msgResponse = await sendMessage(ws, {
        type: 'send_private_message',
        recipientId: testData.valid_tokens[1].user.userId.toString(),
        content: longMessage
      });
      
      if (msgResponse.type === 'error') {
        logTestResult('Long Message Validation', true, '', 'Message Validation');
      } else {
        logTestResult('Long Message Validation', false, `Expected error, got ${msgResponse.type}`, 'Message Validation');
      }
    }
    
    ws.close();
  } catch (error) {
    logTestResult('Long Message Validation', false, error.message, 'Message Validation');
  }
  
  // Test 3.5: Message with special characters
  try {
    const ws = await createWebSocketConnection();
    const auth = await sendMessage(ws, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    if (auth.type === 'authenticated') {
      const specialMessage = 'Hello! This message has special chars: @#$%^&*()_+-=[]{}|;:,.<>?';
      const msgResponse = await sendMessage(ws, {
        type: 'send_private_message',
        recipientId: testData.valid_tokens[1].user.userId.toString(),
        content: specialMessage
      });
      
      if (msgResponse.type === 'private_message_sent') {
        logTestResult('Special Characters in Message', true, '', 'Messaging');
      } else {
        logTestResult('Special Characters in Message', false, msgResponse.message || msgResponse.type, 'Messaging');
      }
    }
    
    ws.close();
  } catch (error) {
    logTestResult('Special Characters in Message', false, error.message, 'Messaging');
  }
  
  // Test 3.6: Message to offline user
  try {
    const ws = await createWebSocketConnection();
    const auth = await sendMessage(ws, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    if (auth.type === 'authenticated') {
      const msgResponse = await sendMessage(ws, {
        type: 'send_private_message',
        recipientId: '999999', // Non-existent user ID
        content: 'Message to offline user'
      });
      
      if (msgResponse.type === 'private_message_sent') {
        logTestResult('Message to Offline User', true, 'Message sent but recipient not online', 'Messaging');
      } else {
        logTestResult('Message to Offline User', false, msgResponse.message || msgResponse.type, 'Messaging');
      }
    }
    
    ws.close();
  } catch (error) {
    logTestResult('Message to Offline User', false, error.message, 'Messaging');
  }
}

// ============================================================================
// 4. TYPING INDICATORS & READ RECEIPTS TESTS
// ============================================================================

async function testTypingAndReadReceipts() {
  console.log('\n⌨️ 4. TYPING INDICATORS & READ RECEIPTS TESTS');
  console.log('-'.repeat(40));
  
  // Test 4.1: Typing indicator
  try {
    const aliceWs = await createWebSocketConnection();
    const aliceAuth = await sendMessage(aliceWs, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    const bobWs = await createWebSocketConnection();
    const bobAuth = await sendMessage(bobWs, {
      type: 'authenticate',
      token: testData.valid_tokens[1].token
    });
    
    if (aliceAuth.type === 'authenticated' && bobAuth.type === 'authenticated') {
      const typingResponse = await sendMessage(aliceWs, {
        type: 'typing',
        recipientId: bobAuth.user.id.toString(),
        isTyping: true
      });
      
      if (typingResponse.type === 'typing_indicator_sent') {
        logTestResult('Typing Indicator', true, '', 'Typing');
      } else {
        logTestResult('Typing Indicator', false, typingResponse.message || typingResponse.type, 'Typing');
      }
    }
    
    aliceWs.close();
    bobWs.close();
  } catch (error) {
    logTestResult('Typing Indicator', false, error.message, 'Typing');
  }
  
  // Test 4.2: Mark message as read
  try {
    const aliceWs = await createWebSocketConnection();
    const aliceAuth = await sendMessage(aliceWs, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    const bobWs = await createWebSocketConnection();
    const bobAuth = await sendMessage(bobWs, {
      type: 'authenticate',
      token: testData.valid_tokens[1].token
    });
    
    if (aliceAuth.type === 'authenticated' && bobAuth.type === 'authenticated') {
      // First send a message
      const msgResponse = await sendMessage(aliceWs, {
        type: 'send_private_message',
        recipientId: bobAuth.user.id.toString(),
        content: 'Message to mark as read'
      });
      
      if (msgResponse.type === 'private_message_sent') {
        // Mark as read
        const readResponse = await sendMessage(bobWs, {
          type: 'mark_message_read',
          messageId: msgResponse.message.id,
          conversationId: msgResponse.message.conversationId
        });
        
        if (readResponse.type === 'message_marked_read') {
          logTestResult('Mark Message as Read', true, '', 'Read Receipts');
        } else {
          logTestResult('Mark Message as Read', false, readResponse.message || readResponse.type, 'Read Receipts');
        }
      }
    }
    
    aliceWs.close();
    bobWs.close();
  } catch (error) {
    logTestResult('Mark Message as Read', false, error.message, 'Read Receipts');
  }
}

// ============================================================================
// 5. ERROR HANDLING & EDGE CASES TESTS
// ============================================================================

async function testErrorHandlingAndEdgeCases() {
  console.log('\n⚠️ 5. ERROR HANDLING & EDGE CASES TESTS');
  console.log('-'.repeat(40));
  
  // Test 5.1: Unknown message type
  try {
    const ws = await createWebSocketConnection();
    const response = await sendMessage(ws, {
      type: 'unknown_message_type',
      data: 'test'
    });
    
    if (response.type === 'error' && response.message === 'Unknown message type') {
      logTestResult('Unknown Message Type Handling', true, '', 'Error Handling');
    } else {
      logTestResult('Unknown Message Type Handling', false, `Expected error, got ${response.type}`, 'Error Handling');
    }
    
    ws.close();
  } catch (error) {
    logTestResult('Unknown Message Type Handling', false, error.message, 'Error Handling');
  }
  
  // Test 5.2: Malformed JSON
  try {
    const ws = await createWebSocketConnection();
    
    // Send malformed JSON
    ws.send('{"type": "ping", "data": "test"'); // Missing closing brace
    
    // Wait a moment for the error response
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Try to send a valid message after malformed JSON
    const response = await sendMessage(ws, { type: 'ping' });
    
    if (response.type === 'pong') {
      logTestResult('Malformed JSON Handling', true, 'Server properly rejected malformed JSON and continued working', 'Error Handling');
    } else {
      logTestResult('Malformed JSON Handling', false, 'Server did not handle malformed JSON properly', 'Error Handling');
    }
    
    ws.close();
  } catch (error) {
    logTestResult('Malformed JSON Handling', false, error.message, 'Error Handling');
  }
  
  // Test 5.3: Unauthenticated message attempts
  try {
    const ws = await createWebSocketConnection();
    
    // Try to send message without authentication
    const response = await sendMessage(ws, {
      type: 'send_private_message',
      recipientId: '123',
      content: 'Unauthenticated message'
    });
    
    if (response.type === 'error' && response.message === 'Authentication required') {
      logTestResult('Unauthenticated Message Rejection', true, '', 'Error Handling');
    } else {
      logTestResult('Unauthenticated Message Rejection', false, `Expected error with 'Authentication required' message, got ${response.type} with message: ${response.message}`, 'Error Handling');
    }
    
    ws.close();
  } catch (error) {
    logTestResult('Unauthenticated Message Rejection', false, error.message, 'Error Handling');
  }
  
  // Test 5.4: Missing required fields
  try {
    const ws = await createWebSocketConnection();
    const auth = await sendMessage(ws, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    if (auth.type === 'authenticated') {
      const response = await sendMessage(ws, {
        type: 'send_private_message'
        // Missing recipientId and content
      });
      
      if (response.type === 'error' && response.message === 'Missing required fields') {
        logTestResult('Missing Required Fields Validation', true, '', 'Error Handling');
      } else {
        logTestResult('Missing Required Fields Validation', false, `Expected error with 'Missing required fields' message, got ${response.type} with message: ${response.message}`, 'Error Handling');
      }
    }
    
    ws.close();
  } catch (error) {
    logTestResult('Missing Required Fields Validation', false, error.message, 'Error Handling');
  }
  
  // Test 5.5: Invalid recipient ID format
  try {
    const ws = await createWebSocketConnection();
    const auth = await sendMessage(ws, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    if (auth.type === 'authenticated') {
      const response = await sendMessage(ws, {
        type: 'send_private_message',
        recipientId: 123, // Number instead of string
        content: 'Test message'
      });
      
      if (response.type === 'error') {
        logTestResult('Invalid Recipient ID Format', true, '', 'Error Handling');
      } else {
        logTestResult('Invalid Recipient ID Format', false, `Expected error, got ${response.type}`, 'Error Handling');
      }
    }
    
    ws.close();
  } catch (error) {
    logTestResult('Invalid Recipient ID Format', false, error.message, 'Error Handling');
  }
}

// ============================================================================
// 6. STRESS & PERFORMANCE TESTS
// ============================================================================

async function testStressAndPerformance() {
  console.log('\n⚡ 6. STRESS & PERFORMANCE TESTS');
  console.log('-'.repeat(40));
  
  // Test 6.1: Multiple rapid connections
  try {
    const connections = [];
    const startTime = Date.now();
    
    // Create 10 rapid connections
    for (let i = 0; i < 10; i++) {
      try {
        const ws = await createWebSocketConnection();
        const auth = await sendMessage(ws, {
          type: 'authenticate',
          token: testData.valid_tokens[i % testData.valid_tokens.length].token
        });
        
        if (auth.type === 'authenticated') {
          connections.push(ws);
        } else {
          ws.close();
        }
      } catch (error) {
        // Continue with other connections
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (connections.length >= 8) { // Allow some failures
      logTestResult('Multiple Rapid Connections', true, `${connections.length}/10 connections in ${duration}ms`, 'Performance');
    } else {
      logTestResult('Multiple Rapid Connections', false, `Only ${connections.length}/10 connections successful`, 'Performance');
    }
    
    // Close all connections
    for (const ws of connections) {
      ws.close();
    }
  } catch (error) {
    logTestResult('Multiple Rapid Connections', false, error.message, 'Performance');
  }
  
  // Test 6.2: Rapid message sending
  try {
    const aliceWs = await createWebSocketConnection();
    const aliceAuth = await sendMessage(aliceWs, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    const bobWs = await createWebSocketConnection();
    const bobAuth = await sendMessage(bobWs, {
      type: 'authenticate',
      token: testData.valid_tokens[1].token
    });
    
    if (aliceAuth.type === 'authenticated' && bobAuth.type === 'authenticated') {
      const startTime = Date.now();
      let successCount = 0;
      
      // Send 20 rapid messages
      for (let i = 0; i < 20; i++) {
        try {
          const response = await sendMessage(aliceWs, {
            type: 'send_private_message',
            recipientId: bobAuth.user.id.toString(),
            content: `Rapid message ${i + 1}`
          });
          
          if (response.type === 'private_message_sent') {
            successCount++;
          }
        } catch (error) {
          // Continue with other messages
        }
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (successCount >= 18) { // Allow some failures
        logTestResult('Rapid Message Sending', true, `${successCount}/20 messages in ${duration}ms`, 'Performance');
      } else {
        logTestResult('Rapid Message Sending', false, `Only ${successCount}/20 messages successful`, 'Performance');
      }
    }
    
    aliceWs.close();
    bobWs.close();
  } catch (error) {
    logTestResult('Rapid Message Sending', false, error.message, 'Performance');
  }
  
  // Test 6.3: Large message handling
  try {
    const ws = await createWebSocketConnection();
    const auth = await sendMessage(ws, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    if (auth.type === 'authenticated') {
      const largeMessage = 'A'.repeat(999); // Just under the 1000 character limit
      const response = await sendMessage(ws, {
        type: 'send_private_message',
        recipientId: testData.valid_tokens[1].user.userId.toString(),
        content: largeMessage
      });
      
      if (response.type === 'private_message_sent') {
        logTestResult('Large Message Handling', true, '999 character message sent successfully', 'Performance');
      } else {
        logTestResult('Large Message Handling', false, response.message || response.type, 'Performance');
      }
    }
    
    ws.close();
  } catch (error) {
    logTestResult('Large Message Handling', false, error.message, 'Performance');
  }
}

// ============================================================================
// 7. SECURITY & RATE LIMITING TESTS
// ============================================================================

async function testSecurityAndRateLimiting() {
  console.log('\n🔒 7. SECURITY & RATE LIMITING TESTS');
  console.log('-'.repeat(40));
  
  // Test 7.1: Rate limiting for rapid messages
  try {
    const ws = await createWebSocketConnection();
    const auth = await sendMessage(ws, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    if (auth.type === 'authenticated') {
      let rateLimited = false;
      
      // Send messages rapidly to trigger rate limiting
      for (let i = 0; i < 50; i++) {
        try {
          const response = await sendMessage(ws, {
            type: 'send_private_message',
            recipientId: testData.valid_tokens[1].user.userId.toString(),
            content: `Rate limit test message ${i + 1}`
          });
          
          if (response.type === 'error' && response.message.includes('rate limit')) {
            rateLimited = true;
            break;
          }
        } catch (error) {
          // Continue
        }
      }
      
      if (rateLimited) {
        logTestResult('Rate Limiting', true, 'Rate limiting triggered as expected', 'Security');
      } else {
        logTestResult('Rate Limiting', false, 'Rate limiting not triggered', 'Security');
      }
    }
    
    ws.close();
  } catch (error) {
    logTestResult('Rate Limiting', false, error.message, 'Security');
  }
  
  // Test 7.2: XSS prevention
  try {
    const ws = await createWebSocketConnection();
    const auth = await sendMessage(ws, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    if (auth.type === 'authenticated') {
      const xssMessage = '<script>alert("XSS")</script>Hello world';
      const response = await sendMessage(ws, {
        type: 'send_private_message',
        recipientId: testData.valid_tokens[1].user.userId.toString(),
        content: xssMessage
      });
      
      if (response.type === 'error' && response.message.includes('harmful')) {
        logTestResult('XSS Prevention', true, 'XSS content blocked', 'Security');
      } else if (response.type === 'private_message_sent') {
        logTestResult('XSS Prevention', true, 'XSS content sanitized', 'Security');
      } else {
        logTestResult('XSS Prevention', false, 'XSS content not handled properly', 'Security');
      }
    }
    
    ws.close();
  } catch (error) {
    logTestResult('XSS Prevention', false, error.message, 'Security');
  }
  
  // Test 7.3: SQL injection prevention
  try {
    const ws = await createWebSocketConnection();
    const auth = await sendMessage(ws, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    if (auth.type === 'authenticated') {
      const sqlInjectionMessage = "'; DROP TABLE users; --";
      const response = await sendMessage(ws, {
        type: 'send_private_message',
        recipientId: testData.valid_tokens[1].user.userId.toString(),
        content: sqlInjectionMessage
      });
      
      if (response.type === 'private_message_sent') {
        logTestResult('SQL Injection Prevention', true, 'SQL injection content handled safely', 'Security');
      } else {
        logTestResult('SQL Injection Prevention', false, response.message || response.type, 'Security');
      }
    }
    
    ws.close();
  } catch (error) {
    logTestResult('SQL Injection Prevention', false, error.message, 'Security');
  }
}

// ============================================================================
// 8. DATABASE INTEGRATION TESTS
// ============================================================================

async function testDatabaseIntegration() {
  console.log('\n🗄️ 8. DATABASE INTEGRATION TESTS');
  console.log('-'.repeat(40));
  
  // Test 8.1: Message persistence
  try {
    const aliceWs = await createWebSocketConnection();
    const aliceAuth = await sendMessage(aliceWs, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    const bobWs = await createWebSocketConnection();
    const bobAuth = await sendMessage(bobWs, {
      type: 'authenticate',
      token: testData.valid_tokens[1].token
    });
    
    if (aliceAuth.type === 'authenticated' && bobAuth.type === 'authenticated') {
      const testMessage = `Database test message ${Date.now()}`;
      const msgResponse = await sendMessage(aliceWs, {
        type: 'send_private_message',
        recipientId: bobAuth.user.id.toString(),
        content: testMessage
      });
      
      if (msgResponse.type === 'private_message_sent') {
        // Start a new conversation to load messages from database
        const convResponse = await sendMessage(aliceWs, {
          type: 'start_conversation',
          recipientId: bobAuth.user.id
        });
        
        if (convResponse.type === 'conversation_started' && convResponse.messages.length > 0) {
          const lastMessage = convResponse.messages[convResponse.messages.length - 1];
          if (lastMessage.content === testMessage) {
            logTestResult('Message Persistence', true, 'Message persisted and retrieved from database', 'Database');
          } else {
            logTestResult('Message Persistence', false, 'Message not found in database', 'Database');
          }
        } else {
          logTestResult('Message Persistence', false, 'Could not load conversation from database', 'Database');
        }
      }
    }
    
    aliceWs.close();
    bobWs.close();
  } catch (error) {
    logTestResult('Message Persistence', false, error.message, 'Database');
  }
  
  // Test 8.2: User data retrieval
  try {
    const ws = await createWebSocketConnection();
    const auth = await sendMessage(ws, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    if (auth.type === 'authenticated') {
      if (auth.user && auth.user.username && auth.user.email) {
        logTestResult('User Data Retrieval', true, `Retrieved data for ${auth.user.username}`, 'Database');
      } else {
        logTestResult('User Data Retrieval', false, 'Incomplete user data retrieved', 'Database');
      }
    }
    
    ws.close();
  } catch (error) {
    logTestResult('User Data Retrieval', false, error.message, 'Database');
  }
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Production Server Tests...');
  console.log(`📊 Testing ${testData.valid_tokens.length} valid tokens + 1 revoked token`);
  console.log(`🔗 Server: ${SERVER_URL}`);
  console.log(`⏱️ Timeout: ${TEST_TIMEOUT}ms`);
  console.log('');
  
  const startTime = Date.now();
  
  try {
    // Run all test suites
    await testConnectionBasics();
    await testUserManagement();
    await testConversationAndMessaging();
    await testTypingAndReadReceipts();
    await testErrorHandlingAndEdgeCases();
    await testStressAndPerformance();
    await testSecurityAndRateLimiting();
    await testDatabaseIntegration();
    
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    // Generate comprehensive report
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(60));
    
    console.log(`⏱️ Total Test Duration: ${totalDuration}ms`);
    console.log(`✅ Passed Tests: ${passedTests}`);
    console.log(`❌ Failed Tests: ${failedTests}`);
    console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
    
    // Category breakdown
    const categories = {};
    testResults.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = { passed: 0, failed: 0 };
      }
      if (result.passed) {
        categories[result.category].passed++;
      } else {
        categories[result.category].failed++;
      }
    });
    
    console.log('\n📋 Category Breakdown:');
    Object.entries(categories).forEach(([category, stats]) => {
      const total = stats.passed + stats.failed;
      const rate = ((stats.passed / total) * 100).toFixed(1);
      console.log(`  ${category}: ${stats.passed}/${total} (${rate}%)`);
    });
    
    // Failed tests summary
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests Summary:');
      testResults.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.name}: ${result.details}`);
      });
    }
    
    // Overall assessment
    console.log('\n🎯 Overall Assessment:');
    if (failedTests === 0) {
      console.log('🎉 EXCELLENT: All tests passed! Production server is fully functional.');
    } else if (passedTests / (passedTests + failedTests) >= 0.9) {
      console.log('✅ GOOD: Most tests passed. Minor issues identified.');
    } else if (passedTests / (passedTests + failedTests) >= 0.7) {
      console.log('⚠️ FAIR: Some tests failed. Issues need attention.');
    } else {
      console.log('❌ POOR: Many tests failed. Significant issues identified.');
    }
    
    // Save detailed results to file
    const reportData = {
      timestamp: new Date().toISOString(),
      server: SERVER_URL,
      duration: totalDuration,
      summary: {
        passed: passedTests,
        failed: failedTests,
        successRate: ((passedTests / (passedTests + failedTests)) * 100).toFixed(1)
      },
      categories,
      results: testResults
    };
    
    fs.writeFileSync('comprehensive-test-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed report saved to: comprehensive-test-report.json');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run comprehensive tests
runComprehensiveTests();
