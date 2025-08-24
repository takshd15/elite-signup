const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const JWT_SECRET = '12341234123412341234123412341234123412341234';

function createTestToken(userId, username) {
  return jwt.sign({
    sub: userId,
    username: username,
    email: `${username}@example.com`,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  }, Buffer.from(JWT_SECRET, 'base64'), { algorithm: 'HS256' });
}

async function testReplyAndReactions() {
  console.log('🚀 Testing Reply and Reaction Features...\n');
  
  // User 1 sends a message
  const ws1 = new WebSocket('ws://localhost:8080');
  const token1 = createTestToken('123', 'alice');
  
  ws1.on('open', () => {
    console.log('👤 Alice connected');
    ws1.send(JSON.stringify({ type: 'authenticate', token: token1 }));
  });
  
  ws1.on('message', (data) => {
    const message = JSON.parse(data);
    
    if (message.type === 'authenticated') {
      console.log('✅ Alice authenticated');
      ws1.send(JSON.stringify({ type: 'join_channel', channelId: 'general' }));
    }
    
    if (message.type === 'channel_joined') {
      console.log('📺 Alice joined general channel');
      
      // Send original message
      setTimeout(() => {
        console.log('💬 Alice sending original message...');
        ws1.send(JSON.stringify({
          type: 'send_message',
          channelId: 'general',
          content: 'Hello everyone! This is my original message! 👋'
        }));
      }, 1000);
    }
    
    if (message.type === 'message') {
      console.log(`💬 Message sent: "${message.content}"`);
      console.log(`   Message ID: ${message.id}`);
      
      // Reply to this message
      setTimeout(() => {
        console.log('🔄 Alice replying to her own message...');
        ws1.send(JSON.stringify({
          type: 'send_message',
          channelId: 'general',
          content: 'This is a reply to my message! 👍',
          replyTo: message.id
        }));
      }, 2000);
      
      // Add reaction to the original message
      setTimeout(() => {
        console.log('😀 Alice adding 👍 reaction...');
        ws1.send(JSON.stringify({
          type: 'add_reaction',
          messageId: message.id,
          emoji: '👍'
        }));
      }, 4000);
      
      // Add another reaction
      setTimeout(() => {
        console.log('😀 Alice adding ❤️ reaction...');
        ws1.send(JSON.stringify({
          type: 'add_reaction',
          messageId: message.id,
          emoji: '❤️'
        }));
      }, 5000);
      
      // Remove a reaction
      setTimeout(() => {
        console.log('😀 Alice removing 👍 reaction...');
        ws1.send(JSON.stringify({
          type: 'remove_reaction',
          messageId: message.id,
          emoji: '👍'
        }));
      }, 7000);
    }
    
    if (message.type === 'reaction_added') {
      console.log(`😀 Reaction added: ${message.reaction.emoji} by ${message.reaction.user.username}`);
    }
    
    if (message.type === 'reaction_removed') {
      console.log(`😀 Reaction removed: ${message.emoji} by ${message.user.username}`);
    }
  });
  
  // Disconnect after 10 seconds
  setTimeout(() => {
    ws1.close();
    console.log('🔌 Alice disconnected');
    console.log('\n✅ Reply and Reaction test completed!');
    process.exit(0);
  }, 10000);
}

testReplyAndReactions().catch(console.error);
