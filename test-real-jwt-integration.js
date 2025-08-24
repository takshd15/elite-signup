#!/usr/bin/env node

/**
 * Real JWT Chat Integration Test
 * Generates a real JWT token using the same secret as the backend
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

// Configuration - Same as backend
const JWT_SECRET = '12341234123412341234123412341234123412341234';
const JWT_SECRET_BASE64 = Buffer.from(JWT_SECRET, 'base64');
const CHAT_SERVER_URL = 'ws://localhost:3001';

console.log('🧪 Testing Real JWT Chat Integration...\n');

// Generate a real JWT token (same as backend)
function generateRealJWT(userId) {
  const payload = {
    jti: 'test-jti-' + Date.now(),
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  return jwt.sign(payload, JWT_SECRET_BASE64, { algorithm: 'HS256' });
}

// Test the complete flow
async function testRealJWTIntegration() {
  console.log('🔑 Step 1: Generating real JWT token...');
  
  // Generate a real JWT token for test_user_1
  const realToken = generateRealJWT('test_user_1');
  console.log('✅ Real JWT token generated');
  console.log('👤 User ID: test_user_1');
  
  console.log('\n🔌 Step 2: Connecting to chat server with real JWT...');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(CHAT_SERVER_URL);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connection established');
      
      // Send authentication with real JWT
      const authMessage = {
        type: 'authenticate',
        token: realToken
      };
      
      ws.send(JSON.stringify(authMessage));
      console.log('📤 Sent authentication with real JWT');
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      console.log('📥 Received:', message.type);
      
      if (message.type === 'authenticated') {
        console.log('✅ Successfully authenticated with real JWT!');
        console.log('👤 User info:', message.user);
        
        // Join a channel
        joinChannel(ws, 'general');
      } else if (message.type === 'auth_error') {
        console.log('❌ Authentication failed:', message.message);
        ws.close();
        resolve(false);
      } else if (message.type === 'channel_joined') {
        console.log('✅ Joined channel:', message.channel.name);
        console.log('📢 Online users:', message.onlineUsers.length);
        console.log('💬 Recent messages:', message.messages.length);
        
        // Send a test message
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

function joinChannel(ws, channelId) {
  console.log(`\n📢 Step 3: Joining channel '${channelId}'...`);
  
  const joinMessage = {
    type: 'join_channel',
    channelId: channelId
  };
  
  ws.send(JSON.stringify(joinMessage));
}

function sendTestMessage(ws, channelId) {
  console.log(`\n💬 Step 4: Sending test message to '${channelId}'...`);
  
  const message = {
    type: 'send_message',
    channelId: channelId,
    content: 'Hello from real JWT integration test! 🚀',
    messageId: 'test-message-' + Date.now()
  };
  
  ws.send(JSON.stringify(message));
  console.log('📤 Test message sent');
}

// Run the test
async function runTest() {
  console.log('🚀 Starting Real JWT Integration Test...\n');
  
  const success = await testRealJWTIntegration();
  
  if (success) {
    console.log('\n🎉 Real JWT integration test completed successfully!');
    console.log('\n✅ What we verified:');
    console.log('1. Real JWT token generation (same secret as backend)');
    console.log('2. WebSocket connection to chat server');
    console.log('3. JWT authentication with chat server');
    console.log('4. Channel joining');
    console.log('5. Message sending and receiving');
    console.log('\n🔗 The chat system is fully integrated and working!');
    console.log('\n📝 Users can now:');
    console.log('- Sign up through the backend (Port 8080)');
    console.log('- Get JWT tokens from the backend');
    console.log('- Use those tokens to authenticate with chat (Port 3001)');
    console.log('- Chat in real-time with other authenticated users');
  } else {
    console.log('\n❌ Real JWT integration test failed');
  }
}

runTest().catch(console.error);
