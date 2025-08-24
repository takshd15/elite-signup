const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const JWT_SECRET = '12341234123412341234123412341234123412341234';

function createTestToken() {
  return jwt.sign({
    sub: '123',
    username: 'testuser',
    email: 'test@example.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  }, Buffer.from(JWT_SECRET, 'base64'), { algorithm: 'HS256' });
}

const channels = ['general', 'feedback', 'career', 'learning', 'networking'];

async function testChannel(channelId) {
  return new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:8080');
    const token = createTestToken();
    
    ws.on('open', () => {
      console.log(`🔗 Connecting to ${channelId}...`);
      
      // Authenticate
      ws.send(JSON.stringify({
        type: 'authenticate',
        token: token
      }));
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      
      if (message.type === 'authenticated') {
        console.log(`✅ Authenticated for ${channelId}`);
        
        // Join the specific channel
        ws.send(JSON.stringify({
          type: 'join_channel',
          channelId: channelId
        }));
      }
      
      if (message.type === 'channel_joined') {
        console.log(`📺 Joined ${message.channel.name}: "${message.channel.description || 'No description'}"`);
        console.log(`   👥 Users online: ${message.onlineUsers ? message.onlineUsers.length : 0}`);
        console.log(`   💬 Recent messages: ${message.recentMessages ? message.recentMessages.length : 0}`);
        
        // Send a test message
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: 'send_message',
            channelId: channelId,
            content: `Test message in ${channelId} channel! 🚀`
          }));
        }, 500);
      }
      
      if (message.type === 'message') {
        console.log(`💬 Message sent successfully in ${channelId}`);
      }
    });
    
    ws.on('close', () => {
      console.log(`🔌 Disconnected from ${channelId}\n`);
      resolve();
    });
    
    // Disconnect after 3 seconds
    setTimeout(() => {
      ws.close();
    }, 3000);
  });
}

async function testAllChannels() {
  console.log('🚀 Testing all chat channels...\n');
  
  for (const channel of channels) {
    await testChannel(channel);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between channels
  }
  
  console.log('✅ All channels tested successfully!');
}

testAllChannels().catch(console.error);
