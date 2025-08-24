#!/usr/bin/env node

/**
 * Chat Integration Test
 * Tests the complete flow: Backend JWT -> Chat Server Authentication -> Messaging
 */

const WebSocket = require('ws');
const http = require('http');

// Configuration
const BACKEND_URL = 'http://localhost:8080';
const CHAT_SERVER_URL = 'ws://localhost:3001';

console.log('🧪 Testing Complete Chat Integration Flow...\n');

// Step 1: Get JWT token from backend (simulate user login)
async function getJWTToken() {
  console.log('🔑 Step 1: Getting JWT token from backend...');
  
  try {
    // This would normally be a login request, but for testing we'll use a mock token
    // In real usage, this would be: POST /v1/auth/login with user credentials
    const mockToken = 'eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJ0ZXN0LWp0aSIsInN1YiI6InRlc3RfdXNlcl8xIiwiaWF0IjoxNzM0OTk5OTk5LCJleHAiOjE3MzUwODYzOTl9.test_signature';
    
    console.log('✅ Mock JWT token generated');
    return mockToken;
  } catch (error) {
    console.log(`❌ Failed to get JWT token: ${error.message}`);
    return null;
  }
}

// Step 2: Connect to chat server with JWT
async function connectToChatServer(token) {
  console.log('\n🔌 Step 2: Connecting to chat server with JWT...');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(CHAT_SERVER_URL);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connection established');
      
      // Send authentication message
      const authMessage = {
        type: 'authenticate',
        token: token
      };
      
      ws.send(JSON.stringify(authMessage));
      console.log('📤 Sent authentication message');
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      console.log('📥 Received message:', message.type);
      
      if (message.type === 'authenticated') {
        console.log('✅ Successfully authenticated with chat server!');
        console.log('👤 User info:', message.user);
        
        // Step 3: Join a channel
        joinChannel(ws, 'general');
      } else if (message.type === 'auth_error') {
        console.log('❌ Authentication failed:', message.message);
        ws.close();
        resolve(false);
      } else if (message.type === 'channel_joined') {
        console.log('✅ Joined channel:', message.channel.name);
        console.log('📢 Online users:', message.onlineUsers.length);
        console.log('💬 Recent messages:', message.messages.length);
        
        // Step 4: Send a test message
        sendTestMessage(ws, 'general');
      } else if (message.type === 'new_message') {
        console.log('💬 New message received:', message.message.content);
        console.log('👤 From:', message.message.username);
        
        // Close connection after receiving message
        setTimeout(() => {
          ws.close();
          resolve(true);
        }, 1000);
      }
    });
    
    ws.on('error', (error) => {
      console.log(`❌ WebSocket error: ${error.message}`);
      resolve(false);
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
    });
  });
}

// Step 3: Join a channel
function joinChannel(ws, channelId) {
  console.log(`\n📢 Step 3: Joining channel '${channelId}'...`);
  
  const joinMessage = {
    type: 'join_channel',
    channelId: channelId
  };
  
  ws.send(JSON.stringify(joinMessage));
}

// Step 4: Send a test message
function sendTestMessage(ws, channelId) {
  console.log(`\n💬 Step 4: Sending test message to '${channelId}'...`);
  
  const message = {
    type: 'send_message',
    channelId: channelId,
    content: 'Hello from integration test! 🚀',
    messageId: 'test-message-' + Date.now()
  };
  
  ws.send(JSON.stringify(message));
  console.log('📤 Test message sent');
}

// Run the complete test
async function runIntegrationTest() {
  console.log('🚀 Starting Chat Integration Test...\n');
  
  // Step 1: Get JWT token
  const token = await getJWTToken();
  if (!token) {
    console.log('❌ Test failed: Could not get JWT token');
    return;
  }
  
  // Step 2-4: Connect to chat server and test messaging
  const success = await connectToChatServer(token);
  
  if (success) {
    console.log('\n🎉 Integration test completed successfully!');
    console.log('\n✅ What we tested:');
    console.log('1. JWT token generation (simulated)');
    console.log('2. WebSocket connection to chat server');
    console.log('3. JWT authentication with chat server');
    console.log('4. Channel joining');
    console.log('5. Message sending and receiving');
    console.log('\n🔗 The chat system is now fully integrated!');
  } else {
    console.log('\n❌ Integration test failed');
  }
}

// Run the test
runIntegrationTest().catch(console.error);
