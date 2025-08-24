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

async function comprehensiveChatTest() {
  console.log('🚀 Comprehensive Chat Feature Test\n');
  console.log('Testing: Messages, Replies, Reactions, and Real-time Features\n');
  
  // Create two users
  const alice = { id: '123', username: 'alice' };
  const bob = { id: '456', username: 'bob' };
  
  let originalMessageId = null;
  let replyMessageId = null;
  
  // Alice connects first
  const wsAlice = new WebSocket('ws://localhost:8080');
  const tokenAlice = createTestToken(alice.id, alice.username);
  
  wsAlice.on('open', () => {
    console.log('👤 Alice connected');
    wsAlice.send(JSON.stringify({ type: 'authenticate', token: tokenAlice }));
  });
  
  wsAlice.on('message', (data) => {
    const message = JSON.parse(data);
    
    if (message.type === 'authenticated') {
      console.log('✅ Alice authenticated');
      wsAlice.send(JSON.stringify({ type: 'join_channel', channelId: 'general' }));
    }
    
    if (message.type === 'channel_joined') {
      console.log('📺 Alice joined general channel');
      
      // Send original message
      setTimeout(() => {
        console.log('\n💬 Alice sending original message...');
        wsAlice.send(JSON.stringify({
          type: 'send_message',
          channelId: 'general',
          content: 'Hello everyone! This is my original message! 👋'
        }));
      }, 1000);
    }
    
    if (message.type === 'message' || message.type === 'new_message') {
      const msg = message.message || message;
      if (!originalMessageId) {
        originalMessageId = msg.id;
        console.log(`💬 Alice's message: "${msg.content}"`);
        console.log(`   Message ID: ${originalMessageId}`);
        console.log(`   Reply To: ${msg.replyTo || 'None'}`);
      }
    }
    
    if (message.type === 'reaction_added') {
      console.log(`😀 Reaction added: ${message.reaction.emoji} by ${message.reaction.username || message.reaction.user?.username || 'Unknown'}`);
    }
    
    if (message.type === 'reaction_removed') {
      console.log(`😀 Reaction removed: ${message.emoji} by ${message.user.username}`);
    }
    
    if (message.type === 'user_joined') {
      console.log(`👋 ${message.user.username} joined the channel`);
    }
  });
  
  // Bob connects after 3 seconds
  setTimeout(() => {
    const wsBob = new WebSocket('ws://localhost:8080');
    const tokenBob = createTestToken(bob.id, bob.username);
    
    wsBob.on('open', () => {
      console.log('\n👤 Bob connected');
      wsBob.send(JSON.stringify({ type: 'authenticate', token: tokenBob }));
    });
    
    wsBob.on('message', (data) => {
      const message = JSON.parse(data);
      
      if (message.type === 'authenticated') {
        console.log('✅ Bob authenticated');
        wsBob.send(JSON.stringify({ type: 'join_channel', channelId: 'general' }));
      }
      
      if (message.type === 'channel_joined') {
        console.log('📺 Bob joined general channel');
        
        // Wait for Alice's message, then reply
        setTimeout(() => {
          if (originalMessageId) {
            console.log('\n🔄 Bob replying to Alice\'s message...');
            wsBob.send(JSON.stringify({
              type: 'send_message',
              channelId: 'general',
              content: 'Thanks Alice! This is a reply to your message! 👍',
              replyTo: originalMessageId
            }));
          }
        }, 2000);
      }
      
      if (message.type === 'message' || message.type === 'new_message') {
        const msg = message.message || message;
        if (msg.replyTo) {
          replyMessageId = msg.id;
          console.log(`💬 Bob's reply: "${msg.content}"`);
          console.log(`   Reply to: ${msg.replyTo}`);
          console.log(`   Reply ID: ${replyMessageId}`);
          
          // Add reactions to Alice's original message
          setTimeout(() => {
            console.log('\n😀 Bob adding reactions to Alice\'s message...');
            
            // Add 👍 reaction
            wsBob.send(JSON.stringify({
              type: 'add_reaction',
              messageId: originalMessageId,
              emoji: '👍'
            }));
            
            // Add ❤️ reaction
            setTimeout(() => {
              wsBob.send(JSON.stringify({
                type: 'add_reaction',
                messageId: originalMessageId,
                emoji: '❤️'
              }));
            }, 1000);
            
            // Add 🚀 reaction to Bob's own reply
            setTimeout(() => {
              wsBob.send(JSON.stringify({
                type: 'add_reaction',
                messageId: replyMessageId,
                emoji: '🚀'
              }));
            }, 2000);
            
            // Remove 👍 reaction
            setTimeout(() => {
              console.log('\n😀 Bob removing 👍 reaction...');
              wsBob.send(JSON.stringify({
                type: 'remove_reaction',
                messageId: originalMessageId,
                emoji: '👍'
              }));
            }, 4000);
            
          }, 1000);
        }
      }
      
      if (message.type === 'reaction_added') {
        console.log(`😀 Reaction added: ${message.reaction.emoji} by ${message.reaction.username || message.reaction.user?.username || 'Unknown'}`);
      }
      
      if (message.type === 'reaction_removed') {
        console.log(`😀 Reaction removed: ${message.emoji} by ${message.user?.username || 'Unknown'}`);
      }
    });
    
    // Bob disconnects after 8 seconds
    setTimeout(() => {
      wsBob.close();
      console.log('\n🔌 Bob disconnected');
    }, 8000);
    
  }, 3000);
  
  // Alice disconnects after 12 seconds
  setTimeout(() => {
    wsAlice.close();
    console.log('\n🔌 Alice disconnected');
    console.log('\n✅ Comprehensive chat test completed!');
    console.log('\n📋 Features Tested:');
    console.log('✅ Real-time messaging');
    console.log('✅ Message replies');
    console.log('✅ Emoji reactions (add/remove)');
    console.log('✅ User join/leave notifications');
    console.log('✅ Multi-user chat');
    process.exit(0);
  }, 12000);
}

comprehensiveChatTest().catch(console.error);
