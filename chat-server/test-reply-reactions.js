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
  
  // Create two users
  const user1 = { id: '123', username: 'alice' };
  const user2 = { id: '456', username: 'bob' };
  
  let originalMessageId = null;
  let replyMessageId = null;
  
  // User 1 connects and sends original message
  const ws1 = new WebSocket('ws://localhost:8080');
  const token1 = createTestToken(user1.id, user1.username);
  
  ws1.on('open', () => {
    console.log(`👤 ${user1.username} connected`);
    
    // Authenticate
    ws1.send(JSON.stringify({
      type: 'authenticate',
      token: token1
    }));
  });
  
  ws1.on('message', (data) => {
    const message = JSON.parse(data);
    
    if (message.type === 'authenticated') {
      console.log(`✅ ${user1.username} authenticated`);
      
      // Join general channel
      ws1.send(JSON.stringify({
        type: 'join_channel',
        channelId: 'general'
      }));
    }
    
    if (message.type === 'channel_joined') {
      console.log(`📺 ${user1.username} joined ${message.channel.name}`);
      
      // Send original message
      setTimeout(() => {
        ws1.send(JSON.stringify({
          type: 'send_message',
          channelId: 'general',
          content: 'Hello everyone! This is my original message! 👋'
        }));
      }, 1000);
    }
    
    if (message.type === 'message') {
      if (!originalMessageId) {
        originalMessageId = message.id;
        console.log(`💬 ${user1.username} sent original message: "${message.content}"`);
        console.log(`   Message ID: ${originalMessageId}`);
      }
    }
  });
  
  // User 2 connects and replies to the message
  setTimeout(() => {
    const ws2 = new WebSocket('ws://localhost:8080');
    const token2 = createTestToken(user2.id, user2.username);
    
    ws2.on('open', () => {
      console.log(`👤 ${user2.username} connected`);
      
      // Authenticate
      ws2.send(JSON.stringify({
        type: 'authenticate',
        token: token2
      }));
    });
    
    ws2.on('message', (data) => {
      const message = JSON.parse(data);
      
      if (message.type === 'authenticated') {
        console.log(`✅ ${user2.username} authenticated`);
        
        // Join general channel
        ws2.send(JSON.stringify({
          type: 'join_channel',
          channelId: 'general'
        }));
      }
      
      if (message.type === 'channel_joined') {
        console.log(`📺 ${user2.username} joined ${message.channel.name}`);
        
        // Wait for original message, then reply
        setTimeout(() => {
          if (originalMessageId) {
            console.log(`🔄 ${user2.username} replying to message ${originalMessageId}...`);
            
            ws2.send(JSON.stringify({
              type: 'send_message',
              channelId: 'general',
              content: 'This is a reply to your message! 👍',
              replyTo: originalMessageId
            }));
          }
        }, 2000);
      }
      
      if (message.type === 'message') {
        if (message.replyTo) {
          replyMessageId = message.id;
          console.log(`💬 ${user2.username} replied: "${message.content}"`);
          console.log(`   Reply to: ${message.replyTo}`);
          console.log(`   Reply ID: ${replyMessageId}`);
          
          // Add reactions to the original message
          setTimeout(() => {
            console.log(`😀 ${user2.username} adding reactions...`);
            
            // Add 👍 reaction to original message
            ws2.send(JSON.stringify({
              type: 'add_reaction',
              messageId: originalMessageId,
              emoji: '👍'
            }));
            
            // Add ❤️ reaction to original message
            setTimeout(() => {
              ws2.send(JSON.stringify({
                type: 'add_reaction',
                messageId: originalMessageId,
                emoji: '❤️'
              }));
            }, 1000);
            
            // Add 🚀 reaction to reply message
            setTimeout(() => {
              ws2.send(JSON.stringify({
                type: 'add_reaction',
                messageId: replyMessageId,
                emoji: '🚀'
              }));
            }, 2000);
            
            // Remove one reaction
            setTimeout(() => {
              console.log(`😀 ${user2.username} removing 👍 reaction...`);
              ws2.send(JSON.stringify({
                type: 'remove_reaction',
                messageId: originalMessageId,
                emoji: '👍'
              }));
            }, 4000);
            
          }, 1000);
        }
      }
      
      if (message.type === 'reaction_added') {
        console.log(`😀 Reaction added: ${message.reaction.emoji} to message ${message.reaction.messageId} by ${message.reaction.user.username}`);
      }
      
      if (message.type === 'reaction_removed') {
        console.log(`😀 Reaction removed: ${message.emoji} from message ${message.messageId} by ${message.user.username}`);
      }
    });
    
    ws2.on('close', () => {
      console.log(`🔌 ${user2.username} disconnected`);
    });
    
    // Disconnect after 8 seconds
    setTimeout(() => {
      ws2.close();
    }, 8000);
    
  }, 3000);
  
  // Disconnect user 1 after 10 seconds
  setTimeout(() => {
    ws1.close();
    console.log(`🔌 ${user1.username} disconnected`);
  }, 10000);
  
  // End test after 12 seconds
  setTimeout(() => {
    console.log('\n✅ Reply and Reaction test completed!');
    process.exit(0);
  }, 12000);
}

testReplyAndReactions().catch(console.error);
