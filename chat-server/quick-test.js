const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const JWT_SECRET = '12341234123412341234123412341234123412341234';

// Test with Calin Gamerul (user1) - one of your existing users
const testUser = {
  id: '1',
  username: 'user1',
  email: 'calin.gamerul@gmail.com',
  name: 'Calin Gamerul'
};

function createTestToken(userId, username) {
  return jwt.sign({
    sub: userId,
    username: username,
    email: `${username}@example.com`,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  }, Buffer.from(JWT_SECRET, 'base64'), { algorithm: 'HS256' });
}

console.log('🚀 Testing Chat System with Existing User: Calin Gamerul\n');

const ws = new WebSocket('ws://localhost:8080');
const token = createTestToken(testUser.id, testUser.username);

ws.on('open', () => {
  console.log(`👤 ${testUser.name} connecting...`);
  ws.send(JSON.stringify({ type: 'authenticate', token: token }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log(`📨 Received: ${message.type}`);

  if (message.type === 'authenticated') {
    console.log(`✅ ${testUser.name} authenticated successfully!`);
    console.log(`   User ID: ${message.user.id}`);
    console.log(`   Username: ${message.user.username}`);
    console.log(`   Display Name: ${message.user.displayName || 'Not set'}`);
    
    // Join general channel
    ws.send(JSON.stringify({ type: 'join_channel', channelId: 'general' }));
  }

  if (message.type === 'channel_joined') {
    console.log(`📺 Joined channel: ${message.channel.name}`);
    console.log(`   Channel ID: ${message.channel.id}`);
    console.log(`   Description: ${message.channel.description || 'No description'}`);
    
    // Send a test message
    setTimeout(() => {
      console.log('\n💬 Sending test message...');
      ws.send(JSON.stringify({
        type: 'send_message',
        channelId: 'general',
        content: `Hello from ${testUser.name}! This is a test message from the database user. 👋`
      }));
    }, 1000);
  }

  if (message.type === 'message' || message.type === 'new_message') {
    const msg = message.message || message;
    console.log(`\n💬 Message sent successfully!`);
    console.log(`   Message ID: ${msg.id}`);
    console.log(`   Content: "${msg.content}"`);
    console.log(`   Timestamp: ${msg.timestamp}`);
    console.log(`   User: ${msg.user?.username || 'Unknown'}`);
    
    // Test completed successfully
    setTimeout(() => {
      console.log('\n✅ Test completed successfully!');
      console.log('📋 Summary:');
      console.log('   ✅ User authentication working');
      console.log('   ✅ Database user lookup working');
      console.log('   ✅ Channel joining working');
      console.log('   ✅ Message sending working');
      console.log('   ✅ Real-time communication working');
      ws.close();
      process.exit(0);
    }, 2000);
  }

  if (message.type === 'error') {
    console.error(`❌ Error: ${message.message}`);
    ws.close();
    process.exit(1);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Test timeout - server may not be running');
  process.exit(1);
}, 10000);
