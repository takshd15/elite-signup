#!/usr/bin/env node

/**
 * Test Reply Functionality
 * Tests message replies and threading in the chat system
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

console.log('🧪 Testing Reply Functionality...\n');

// Test results
const results = {
  originalMessage: false,
  replyMessage: false,
  threadId: false,
  replyTo: false,
  database: false
};

// Get a real user
async function getRealUser() {
  try {
    const client = new Client(DB_CONFIG);
    await client.connect();
    const result = await client.query('SELECT user_id, username FROM users_auth LIMIT 1');
    await client.end();
    return result.rows[0];
  } catch (error) {
    console.log(`❌ Database error: ${error.message}`);
    return null;
  }
}

// Generate JWT
function generateJWT(userId) {
  const payload = {
    jti: 'test-jti-' + Date.now(),
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  };
  return jwt.sign(payload, JWT_SECRET_BASE64, { algorithm: 'HS256' });
}

// Test reply functionality
async function testReplyFunctionality(user) {
  console.log('🔑 Testing Reply Functionality...');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(CHAT_SERVER_URL);
    const token = generateJWT(user.user_id);
    let originalMessageId = null;
    let threadId = null;
    let step = 0;
    
    ws.on('open', () => {
      // Authenticate first
      ws.send(JSON.stringify({
        type: 'authenticate',
        token: token
      }));
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      
      if (message.type === 'authenticated') {
        console.log('✅ Authenticated, joining channel...');
        
        // Join general channel
        ws.send(JSON.stringify({
          type: 'join_channel',
          channelId: 'general'
        }));
      } else if (message.type === 'channel_joined') {
        console.log('✅ Joined channel:', message.channel.name);
        
        // Step 1: Send original message
        console.log('\n📝 Step 1: Sending original message...');
        ws.send(JSON.stringify({
          type: 'send_message',
          channelId: 'general',
          content: 'This is the original message for testing replies! 🚀',
          messageId: 'original-msg-' + Date.now()
        }));
      } else if (message.type === 'new_message' && step === 0) {
        console.log('✅ Original message sent and received');
        console.log(`💬 Message: ${message.message.content}`);
        console.log(`🆔 Message ID: ${message.message.id}`);
        console.log(`🧵 Thread ID: ${message.message.threadId || 'null'}`);
        console.log(`↩️ Reply To: ${message.message.replyTo || 'null'}`);
        
        originalMessageId = message.message.id;
        threadId = message.message.threadId;
        results.originalMessage = true;
        step = 1;
        
        // Step 2: Send reply to the original message
        setTimeout(() => {
          console.log('\n📝 Step 2: Sending reply message...');
          ws.send(JSON.stringify({
            type: 'send_message',
            channelId: 'general',
            content: 'This is a reply to the original message! ↩️',
            messageId: 'reply-msg-' + Date.now(),
            threadId: threadId,
            replyTo: originalMessageId
          }));
        }, 1000);
      } else if (message.type === 'new_message' && step === 1) {
        console.log('✅ Reply message sent and received');
        console.log(`💬 Reply: ${message.message.content}`);
        console.log(`🆔 Message ID: ${message.message.id}`);
        console.log(`🧵 Thread ID: ${message.message.threadId || 'null'}`);
        console.log(`↩️ Reply To: ${message.message.replyTo || 'null'}`);
        
        results.replyMessage = true;
        results.threadId = message.message.threadId === threadId;
        results.replyTo = message.message.replyTo === originalMessageId;
        step = 2;
        
        // Step 3: Send another reply in the same thread
        setTimeout(() => {
          console.log('\n📝 Step 3: Sending second reply in same thread...');
          ws.send(JSON.stringify({
            type: 'send_message',
            channelId: 'general',
            content: 'This is a second reply in the same thread! 🔄',
            messageId: 'reply-msg-2-' + Date.now(),
            threadId: threadId,
            replyTo: originalMessageId
          }));
        }, 1000);
      } else if (message.type === 'new_message' && step === 2) {
        console.log('✅ Second reply sent and received');
        console.log(`💬 Second Reply: ${message.message.content}`);
        console.log(`🆔 Message ID: ${message.message.id}`);
        console.log(`🧵 Thread ID: ${message.message.threadId || 'null'}`);
        console.log(`↩️ Reply To: ${message.message.replyTo || 'null'}`);
        
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

// Test database for reply data
async function testDatabaseForReplies() {
  console.log('\n🗄️ Testing Database for Reply Data...');
  
  try {
    const client = new Client(DB_CONFIG);
    await client.connect();
    
    // Check recent messages with reply data
    const recentMessagesQuery = `
      SELECT 
        m.content, 
        m.user_id, 
        m.thread_id as "threadId",
        m.reply_to as "replyTo",
        m.created_at
      FROM chat_messages m
      WHERE m.thread_id IS NOT NULL OR m.reply_to IS NOT NULL
      ORDER BY m.created_at DESC
      LIMIT 10
    `;
    
    const result = await client.query(recentMessagesQuery);
    
    if (result.rows.length > 0) {
      console.log('✅ Found messages with reply/thread data:');
      result.rows.forEach((msg, index) => {
        console.log(`   ${index + 1}. "${msg.content}"`);
        console.log(`      Thread ID: ${msg.threadId || 'null'}`);
        console.log(`      Reply To: ${msg.replyTo || 'null'}`);
        console.log(`      Time: ${new Date(msg.created_at).toLocaleString()}`);
        console.log('');
      });
      results.database = true;
    } else {
      console.log('⚠️ No messages with reply/thread data found in database');
    }
    
    await client.end();
    return true;
  } catch (error) {
    console.log(`❌ Database test failed: ${error.message}`);
    return false;
  }
}

// Run the test
async function runReplyTest() {
  console.log('🚀 Starting Reply Functionality Test...\n');
  
  // Get user
  const user = await getRealUser();
  if (!user) {
    console.log('❌ No user found');
    return;
  }
  
  console.log(`👤 Testing with user: ${user.username} (ID: ${user.user_id})\n`);
  
  // Test reply functionality
  const replySuccess = await testReplyFunctionality(user);
  
  // Test database
  const dbSuccess = await testDatabaseForReplies();
  
  // Results
  console.log('\n📋 REPLY FUNCTIONALITY TEST RESULTS:');
  console.log('=====================================');
  console.log(`📝 Original Message: ${results.originalMessage ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`↩️ Reply Message: ${results.replyMessage ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🧵 Thread ID: ${results.threadId ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🔄 Reply To: ${results.replyTo ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🗄️ Database: ${results.database ? '✅ PASS' : '❌ FAIL'}`);
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log(`\n📊 Summary: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n🎉 REPLY FUNCTIONALITY IS WORKING PERFECTLY!');
    console.log('\n✅ What\'s working:');
    console.log('- Original message creation');
    console.log('- Reply message creation');
    console.log('- Thread ID generation and linking');
    console.log('- Reply-to message linking');
    console.log('- Database storage of reply data');
    console.log('\n🚀 Reply system is ready for production!');
  } else {
    console.log('\n⚠️ Some reply features need attention');
  }
}

runReplyTest().catch(console.error);
