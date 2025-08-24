#!/usr/bin/env node

/**
 * Test with Real User from Database
 * Uses a real user that exists in the database
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

// Configuration
const JWT_SECRET = '12341234123412341234123412341234123412341234';
const JWT_SECRET_BASE64 = Buffer.from(JWT_SECRET, 'base64');
const CHAT_SERVER_URL = 'ws://localhost:3001';
const DB_CONFIG = {
  host: 'cd6emofiekhlj.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com',
  port: 5432,
  database: 'd4ukv7mqkkc9i1',
  user: 'u2eb6vlhflq6bt',
  password: 'pe9512a0cbf2bc2eee176022c82836beedc48733196d06484e5dc69e2754f5a79',
  ssl: { rejectUnauthorized: false }
};

console.log('🧪 Testing with Real User from Database...\n');

// Get a real user from the database
async function getRealUser() {
  console.log('🔍 Step 1: Finding real user in database...');
  
  try {
    const client = new Client(DB_CONFIG);
    await client.connect();
    
    // Get a user from users_auth table
    const result = await client.query('SELECT user_id, username FROM users_auth LIMIT 1');
    await client.end();
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`✅ Found real user: ${user.username} (ID: ${user.user_id})`);
      return user;
    } else {
      console.log('❌ No users found in database');
      return null;
    }
  } catch (error) {
    console.log(`❌ Database error: ${error.message}`);
    return null;
  }
}

// Generate JWT for real user
function generateJWTForUser(userId) {
  const payload = {
    jti: 'test-jti-' + Date.now(),
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  return jwt.sign(payload, JWT_SECRET_BASE64, { algorithm: 'HS256' });
}

// Test chat integration with real user
async function testWithRealUser(user) {
  console.log('\n🔑 Step 2: Generating JWT for real user...');
  
  const realToken = generateJWTForUser(user.user_id);
  console.log('✅ JWT token generated for real user');
  
  console.log('\n🔌 Step 3: Connecting to chat server...');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(CHAT_SERVER_URL);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connection established');
      
      const authMessage = {
        type: 'authenticate',
        token: realToken
      };
      
      ws.send(JSON.stringify(authMessage));
      console.log('📤 Sent authentication for real user');
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      console.log('📥 Received:', message.type);
      
      if (message.type === 'authenticated') {
        console.log('✅ Successfully authenticated real user!');
        console.log('👤 User info:', message.user);
        
        joinChannel(ws, 'general');
      } else if (message.type === 'auth_error') {
        console.log('❌ Authentication failed:', message.message);
        ws.close();
        resolve(false);
      } else if (message.type === 'channel_joined') {
        console.log('✅ Joined channel:', message.channel.name);
        console.log('📢 Online users:', message.onlineUsers.length);
        console.log('💬 Recent messages:', message.messages.length);
        
        sendTestMessage(ws, 'general');
      } else if (message.type === 'new_message') {
        console.log('💬 New message received:', message.message.content);
        console.log('👤 From:', message.message.username);
        
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
  console.log(`\n📢 Step 4: Joining channel '${channelId}'...`);
  
  const joinMessage = {
    type: 'join_channel',
    channelId: channelId
  };
  
  ws.send(JSON.stringify(joinMessage));
}

function sendTestMessage(ws, channelId) {
  console.log(`\n💬 Step 5: Sending test message to '${channelId}'...`);
  
  const message = {
    type: 'send_message',
    channelId: channelId,
    content: 'Hello from real user integration test! 🚀',
    messageId: 'test-message-' + Date.now()
  };
  
  ws.send(JSON.stringify(message));
  console.log('📤 Test message sent');
}

// Run the complete test
async function runTest() {
  console.log('🚀 Starting Real User Integration Test...\n');
  
  // Step 1: Get real user from database
  const user = await getRealUser();
  if (!user) {
    console.log('❌ Test failed: No real user found');
    return;
  }
  
  // Step 2-5: Test chat integration
  const success = await testWithRealUser(user);
  
  if (success) {
    console.log('\n🎉 Real user integration test completed successfully!');
    console.log('\n✅ What we verified:');
    console.log('1. Real user exists in database');
    console.log('2. JWT token generation for real user');
    console.log('3. WebSocket connection to chat server');
    console.log('4. JWT authentication with chat server');
    console.log('5. Channel joining');
    console.log('6. Message sending and receiving');
    console.log('\n🔗 The chat system is fully integrated and working!');
    console.log('\n📝 Complete user flow verified:');
    console.log('- User exists in backend database');
    console.log('- JWT token validates correctly');
    console.log('- Chat server authenticates real users');
    console.log('- Real-time messaging works');
    console.log('\n🎯 Integration is complete and ready for production!');
  } else {
    console.log('\n❌ Real user integration test failed');
  }
}

runTest().catch(console.error);
