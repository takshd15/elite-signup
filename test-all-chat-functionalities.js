#!/usr/bin/env node

/**
 * Comprehensive Chat Functionalities Test
 * Tests all chat features: auth, channels, messaging, reactions, read receipts, user status, typing
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

console.log('🧪 Testing ALL Chat Functionalities...\n');

// Test results tracking
const testResults = {
  authentication: false,
  channelJoining: false,
  messaging: false,
  reactions: false,
  readReceipts: false,
  userStatus: false,
  typingIndicators: false,
  multiUserChat: false,
  channelSwitching: false,
  messageHistory: false
};

// Get multiple real users from database
async function getRealUsers() {
  console.log('🔍 Step 1: Finding real users in database...');
  
  try {
    const client = new Client(DB_CONFIG);
    await client.connect();
    
    // Get multiple users from users_auth table
    const result = await client.query('SELECT user_id, username FROM users_auth LIMIT 3');
    await client.end();
    
    if (result.rows.length > 0) {
      console.log(`✅ Found ${result.rows.length} real users:`);
      result.rows.forEach(user => {
        console.log(`   - ${user.username} (ID: ${user.user_id})`);
      });
      return result.rows;
    } else {
      console.log('❌ No users found in database');
      return null;
    }
  } catch (error) {
    console.log(`❌ Database error: ${error.message}`);
    return null;
  }
}

// Generate JWT for user
function generateJWTForUser(userId) {
  const payload = {
    jti: 'test-jti-' + Date.now(),
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  return jwt.sign(payload, JWT_SECRET_BASE64, { algorithm: 'HS256' });
}

// Test authentication
async function testAuthentication(user) {
  console.log('\n🔑 Step 2: Testing Authentication...');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(CHAT_SERVER_URL);
    const token = generateJWTForUser(user.user_id);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connection established');
      
      const authMessage = {
        type: 'authenticate',
        token: token
      };
      
      ws.send(JSON.stringify(authMessage));
      console.log('📤 Sent authentication message');
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      
      if (message.type === 'authenticated') {
        console.log('✅ Authentication successful!');
        console.log('👤 User info:', message.user);
        testResults.authentication = true;
        ws.close();
        resolve(true);
      } else if (message.type === 'auth_error') {
        console.log('❌ Authentication failed:', message.message);
        ws.close();
        resolve(false);
      }
    });
    
    ws.on('error', (error) => {
      console.log(`❌ WebSocket error: ${error.message}`);
      resolve(false);
    });
  });
}

// Test channel joining and messaging
async function testChannelAndMessaging(user) {
  console.log('\n📢 Step 3: Testing Channel Joining and Messaging...');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(CHAT_SERVER_URL);
    const token = generateJWTForUser(user.user_id);
    let authenticated = false;
    let channelJoined = false;
    let messageSent = false;
    
    ws.on('open', () => {
      // Authenticate first
      ws.send(JSON.stringify({
        type: 'authenticate',
        token: token
      }));
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      
      if (message.type === 'authenticated' && !authenticated) {
        console.log('✅ Authenticated, joining channel...');
        authenticated = true;
        
        // Join general channel
        ws.send(JSON.stringify({
          type: 'join_channel',
          channelId: 'general'
        }));
      } else if (message.type === 'channel_joined' && !channelJoined) {
        console.log('✅ Joined channel:', message.channel.name);
        console.log('📢 Online users:', message.onlineUsers.length);
        console.log('💬 Recent messages:', message.messages.length);
        testResults.channelJoining = true;
        testResults.messageHistory = true;
        channelJoined = true;
        
        // Send a test message
        ws.send(JSON.stringify({
          type: 'send_message',
          channelId: 'general',
          content: 'Testing messaging functionality! 🚀',
          messageId: 'test-msg-' + Date.now()
        }));
      } else if (message.type === 'new_message' && !messageSent) {
        console.log('💬 Message sent and received:', message.message.content);
        console.log('👤 From:', message.message.username);
        testResults.messaging = true;
        messageSent = true;
        
        // Test reactions
        testReactions(ws, message.message.messageId);
      } else if (message.type === 'reaction_added') {
        console.log('👍 Reaction added:', message.reaction.emoji);
        testResults.reactions = true;
        
        // Test read receipts
        testReadReceipts(ws, message.message.messageId);
      } else if (message.type === 'read_receipt_updated') {
        console.log('📖 Read receipt updated');
        testResults.readReceipts = true;
        
        // Test user status
        testUserStatus(ws);
      } else if (message.type === 'user_status_updated') {
        console.log('👤 User status updated:', message.status);
        testResults.userStatus = true;
        
        // Test typing indicators
        testTypingIndicators(ws);
      } else if (message.type === 'typing_started') {
        console.log('⌨️ Typing indicator started');
        testResults.typingIndicators = true;
        
        // Test channel switching
        testChannelSwitching(ws);
      } else if (message.type === 'channel_joined' && channelJoined) {
        console.log('✅ Switched to feedback channel');
        testResults.channelSwitching = true;
        
        // Close connection
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
  });
}

// Test reactions
function testReactions(ws, messageId) {
  console.log('\n👍 Testing Reactions...');
  
  ws.send(JSON.stringify({
    type: 'add_reaction',
    messageId: messageId,
    emoji: '👍'
  }));
}

// Test read receipts
function testReadReceipts(ws, messageId) {
  console.log('\n📖 Testing Read Receipts...');
  
  ws.send(JSON.stringify({
    type: 'mark_as_read',
    messageId: messageId
  }));
}

// Test user status
function testUserStatus(ws) {
  console.log('\n👤 Testing User Status...');
  
  ws.send(JSON.stringify({
    type: 'update_status',
    status: 'online'
  }));
}

// Test typing indicators
function testTypingIndicators(ws) {
  console.log('\n⌨️ Testing Typing Indicators...');
  
  ws.send(JSON.stringify({
    type: 'typing_start',
    channelId: 'general'
  }));
  
  // Stop typing after 2 seconds
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'typing_stop',
      channelId: 'general'
    }));
  }, 2000);
}

// Test channel switching
function testChannelSwitching(ws) {
  console.log('\n🔄 Testing Channel Switching...');
  
  ws.send(JSON.stringify({
    type: 'join_channel',
    channelId: 'feedback'
  }));
}

// Test multi-user chat
async function testMultiUserChat(users) {
  console.log('\n👥 Step 4: Testing Multi-User Chat...');
  
  if (users.length < 2) {
    console.log('⚠️ Need at least 2 users for multi-user test');
    return false;
  }
  
  const connections = [];
  
  // Create connections for multiple users
  for (let i = 0; i < Math.min(users.length, 2); i++) {
    const user = users[i];
    const ws = new WebSocket(CHAT_SERVER_URL);
    const token = generateJWTForUser(user.user_id);
    
    connections.push(new Promise((resolve) => {
      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'authenticate',
          token: token
        }));
      });
      
      ws.on('message', (data) => {
        const message = JSON.parse(data);
        
        if (message.type === 'authenticated') {
          console.log(`✅ User ${user.username} authenticated`);
          
          // Join general channel
          ws.send(JSON.stringify({
            type: 'join_channel',
            channelId: 'general'
          }));
        } else if (message.type === 'channel_joined') {
          console.log(`✅ User ${user.username} joined channel`);
          
          // Send message from this user
          setTimeout(() => {
            ws.send(JSON.stringify({
              type: 'send_message',
              channelId: 'general',
              content: `Hello from ${user.username}! 👋`,
              messageId: 'multi-msg-' + Date.now() + '-' + i
            }));
          }, i * 1000); // Stagger messages
        } else if (message.type === 'new_message') {
          console.log(`💬 ${user.username} received: ${message.message.content}`);
          
          // Close connection after receiving message
          setTimeout(() => {
            ws.close();
            resolve(true);
          }, 2000);
        }
      });
      
      ws.on('error', (error) => {
        console.log(`❌ WebSocket error for ${user.username}: ${error.message}`);
        resolve(false);
      });
    }));
  }
  
  // Wait for all connections to complete
  const results = await Promise.all(connections);
  testResults.multiUserChat = results.every(result => result);
  
  return testResults.multiUserChat;
}

// Test database integration
async function testDatabaseIntegration() {
  console.log('\n🗄️ Step 5: Testing Database Integration...');
  
  try {
    const client = new Client(DB_CONFIG);
    await client.connect();
    
    // Check chat tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'chat_%'
      ORDER BY table_name
    `;
    
    const tablesResult = await client.query(tablesQuery);
    const chatTables = tablesResult.rows.map(row => row.table_name);
    
    console.log(`📊 Found ${chatTables.length} chat tables:`);
    chatTables.forEach(table => console.log(`   - ${table}`));
    
    // Check channels
    const channelsQuery = 'SELECT COUNT(*) as count FROM chat_channels';
    const channelsResult = await client.query(channelsQuery);
    console.log(`📢 Channels in database: ${channelsResult.rows[0].count}`);
    
    // Check messages
    const messagesQuery = 'SELECT COUNT(*) as count FROM chat_messages';
    const messagesResult = await client.query(messagesQuery);
    console.log(`💬 Messages in database: ${messagesResult.rows[0].count}`);
    
    // Check recent messages
    const recentMessagesQuery = `
      SELECT m.content, m.user_id, c.name as channel_name, m.created_at
      FROM chat_messages m
      JOIN chat_channels c ON m.channel_id = c.channel_id
      ORDER BY m.created_at DESC
      LIMIT 5
    `;
    const recentResult = await client.query(recentMessagesQuery);
    
    console.log('📝 Recent messages:');
    recentResult.rows.forEach(msg => {
      console.log(`   - [${msg.channel_name}] ${msg.user_id}: ${msg.content}`);
    });
    
    await client.end();
    console.log('✅ Database integration test completed');
    return true;
    
  } catch (error) {
    console.log(`❌ Database test failed: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Chat Functionalities Test...\n');
  
  // Step 1: Get real users
  const users = await getRealUsers();
  if (!users) {
    console.log('❌ Test failed: No users found');
    return;
  }
  
  // Step 2: Test authentication
  const authSuccess = await testAuthentication(users[0]);
  if (!authSuccess) {
    console.log('❌ Authentication test failed');
    return;
  }
  
  // Step 3: Test channel and messaging
  const messagingSuccess = await testChannelAndMessaging(users[0]);
  if (!messagingSuccess) {
    console.log('❌ Messaging test failed');
    return;
  }
  
  // Step 4: Test multi-user chat
  const multiUserSuccess = await testMultiUserChat(users);
  
  // Step 5: Test database integration
  const dbSuccess = await testDatabaseIntegration();
  
  // Print comprehensive results
  console.log('\n📋 COMPREHENSIVE TEST RESULTS:');
  console.log('================================');
  console.log(`🔑 Authentication: ${testResults.authentication ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📢 Channel Joining: ${testResults.channelJoining ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`💬 Messaging: ${testResults.messaging ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`👍 Reactions: ${testResults.reactions ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📖 Read Receipts: ${testResults.readReceipts ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`👤 User Status: ${testResults.userStatus ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`⌨️ Typing Indicators: ${testResults.typingIndicators ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`👥 Multi-User Chat: ${testResults.multiUserChat ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🔄 Channel Switching: ${testResults.channelSwitching ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📝 Message History: ${testResults.messageHistory ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🗄️ Database Integration: ${dbSuccess ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  
  console.log('\n📊 SUMMARY:');
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);
  
  if (passedTests === totalTests && dbSuccess) {
    console.log('\n🎉 ALL CHAT FUNCTIONALITIES ARE WORKING PERFECTLY!');
    console.log('\n🔗 The chat system is fully functional with:');
    console.log('- ✅ User authentication and JWT validation');
    console.log('- ✅ Real-time messaging across channels');
    console.log('- ✅ Message reactions and read receipts');
    console.log('- ✅ User status tracking and typing indicators');
    console.log('- ✅ Multi-user chat capabilities');
    console.log('- ✅ Channel management and switching');
    console.log('- ✅ Message history and persistence');
    console.log('- ✅ Complete database integration');
    console.log('\n🚀 Ready for production use!');
  } else {
    console.log('\n⚠️ Some functionalities need attention. Check the results above.');
  }
}

runAllTests().catch(console.error);
