const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

// Test multiple users chatting
const users = [
  { id: '123', username: 'alice', email: 'alice@example.com' },
  { id: '456', username: 'bob', email: 'bob@example.com' },
  { id: '789', username: 'charlie', email: 'charlie@example.com' }
];

const JWT_SECRET = '12341234123412341234123412341234123412341234';

function createTestToken(user) {
  return jwt.sign({
    sub: user.id,
    username: user.username,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  }, Buffer.from(JWT_SECRET, 'base64'), { algorithm: 'HS256' });
}

async function testUser(user, delay = 0) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const ws = new WebSocket('ws://localhost:8080');
      const token = createTestToken(user);
      
      ws.on('open', () => {
        console.log(`👤 ${user.username} connected`);
        
        // Authenticate
        ws.send(JSON.stringify({
          type: 'authenticate',
          token: token
        }));
      });
      
      ws.on('message', (data) => {
        const message = JSON.parse(data);
        
        if (message.type === 'authenticated') {
          console.log(`✅ ${user.username} authenticated as ${message.user.displayName}`);
          
          // Join general channel
          ws.send(JSON.stringify({
            type: 'join_channel',
            channelId: 'general'
          }));
        }
        
        if (message.type === 'channel_joined') {
          console.log(`📺 ${user.username} joined ${message.channel.name}`);
          
          // Send a message
          setTimeout(() => {
            ws.send(JSON.stringify({
              type: 'send_message',
              channelId: 'general',
              content: `Hello from ${user.username}! 👋`
            }));
          }, 1000);
        }
        
        if (message.type === 'message') {
          console.log(`💬 ${message.user.username}: ${message.content}`);
        }
        
        if (message.type === 'user_joined') {
          console.log(`👋 ${message.user.username} joined the channel`);
        }
        
        if (message.type === 'user_left') {
          console.log(`👋 ${message.user.username} left the channel`);
        }
      });
      
      ws.on('close', () => {
        console.log(`🔌 ${user.username} disconnected`);
        resolve();
      });
      
      ws.on('error', (error) => {
        console.log(`❌ ${user.username} error:`, error.message);
        resolve();
      });
      
      // Disconnect after 10 seconds
      setTimeout(() => {
        ws.close();
      }, 10000);
      
    }, delay);
  });
}

async function runMultiUserTest() {
  console.log('🚀 Starting multi-user chat test...\n');
  
  // Start all users with staggered delays
  const promises = users.map((user, index) => 
    testUser(user, index * 2000) // 2 second delay between each user
  );
  
  await Promise.all(promises);
  
  console.log('\n✅ Multi-user chat test completed!');
}

runMultiUserTest().catch(console.error);
