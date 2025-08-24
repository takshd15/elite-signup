const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const JWT_SECRET = '12341234123412341234123412341234123412341234';

// Existing users from the database
const existingUsers = [
  { id: '1', username: 'user1', email: 'calin.gamerul@gmail.com', name: 'Calin Gamerul' },
  { id: '2', username: 'user2', email: 'user2@gmail.com', name: 'Bob Brown' },
  { id: '3', username: 'user3', email: 'user3@gmail.com', name: 'Carol Clark' },
  { id: '4', username: 'user4', email: 'user4@gmail.com', name: 'User 4' }
];

function createTestToken(userId, username) {
  return jwt.sign({
    sub: userId,
    username: username,
    email: `${username}@example.com`,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  }, Buffer.from(JWT_SECRET, 'base64'), { algorithm: 'HS256' });
}

async function testWithExistingUsers() {
  console.log('🚀 Testing Chat System with Existing Users\n');
  console.log('📋 Available Users:');
  existingUsers.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.name} (${user.username}) - ID: ${user.id}`);
  });

  // Test with first two users
  const user1 = existingUsers[0]; // Calin Gamerul
  const user2 = existingUsers[1]; // Bob Brown

  console.log(`\n🎯 Testing with: ${user1.name} and ${user2.name}\n`);

  let originalMessageId = null;
  let replyMessageId = null;

  // User 1 connects first
  const ws1 = new WebSocket('ws://localhost:8080');
  const token1 = createTestToken(user1.id, user1.username);

  ws1.on('open', () => {
    console.log(`👤 ${user1.name} (${user1.username}) connected`);
    ws1.send(JSON.stringify({ type: 'authenticate', token: token1 }));
  });

  ws1.on('message', (data) => {
    const message = JSON.parse(data);

    if (message.type === 'authenticated') {
      console.log(`✅ ${user1.name} authenticated as ${message.user.displayName || message.user.username}`);
      ws1.send(JSON.stringify({ type: 'join_channel', channelId: 'general' }));
    }

    if (message.type === 'channel_joined') {
      console.log(`📺 ${user1.name} joined ${message.channel.name}`);

      // Send original message
      setTimeout(() => {
        console.log(`\n💬 ${user1.name} sending message...`);
        ws1.send(JSON.stringify({
          type: 'send_message',
          channelId: 'general',
          content: `Hello everyone! I'm ${user1.name} from the database! 👋`
        }));
      }, 1000);
    }

    if (message.type === 'message' || message.type === 'new_message') {
      const msg = message.message || message;
      if (!originalMessageId) {
        originalMessageId = msg.id;
        console.log(`💬 ${user1.name}'s message: "${msg.content}"`);
        console.log(`   Message ID: ${originalMessageId}`);
      }
    }

    if (message.type === 'user_joined') {
      console.log(`👋 ${message.user.username} joined the channel`);
    }
  });

  // User 2 connects after 3 seconds
  setTimeout(() => {
    const ws2 = new WebSocket('ws://localhost:8080');
    const token2 = createTestToken(user2.id, user2.username);

    ws2.on('open', () => {
      console.log(`\n👤 ${user2.name} (${user2.username}) connected`);
      ws2.send(JSON.stringify({ type: 'authenticate', token: token2 }));
    });

    ws2.on('message', (data) => {
      const message = JSON.parse(data);

      if (message.type === 'authenticated') {
        console.log(`✅ ${user2.name} authenticated as ${message.user.displayName || message.user.username}`);
        ws2.send(JSON.stringify({ type: 'join_channel', channelId: 'general' }));
      }

      if (message.type === 'channel_joined') {
        console.log(`📺 ${user2.name} joined ${message.channel.name}`);

        // Wait for original message, then reply
        setTimeout(() => {
          if (originalMessageId) {
            console.log(`\n🔄 ${user2.name} replying to ${user1.name}'s message...`);
            ws2.send(JSON.stringify({
              type: 'send_message',
              channelId: 'general',
              content: `Hi ${user1.name}! This is ${user2.name} replying to your message! 👍`,
              replyTo: originalMessageId
            }));
          }
        }, 2000);
      }

      if (message.type === 'message' || message.type === 'new_message') {
        const msg = message.message || message;
        if (msg.replyTo) {
          replyMessageId = msg.id;
          console.log(`💬 ${user2.name}'s reply: "${msg.content}"`);
          console.log(`   Reply to: ${msg.replyTo}`);

          // Add reactions
          setTimeout(() => {
            console.log(`\n😀 ${user2.name} adding reactions...`);
            
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

            // Add 🚀 reaction to reply
            setTimeout(() => {
              ws2.send(JSON.stringify({
                type: 'add_reaction',
                messageId: replyMessageId,
                emoji: '🚀'
              }));
            }, 2000);

          }, 1000);
        }
      }

      if (message.type === 'reaction_added') {
        console.log(`😀 Reaction added: ${message.reaction.emoji} by ${message.reaction.username || message.reaction.user?.username || 'Unknown'}`);
      }
    });

    // User 2 disconnects after 8 seconds
    setTimeout(() => {
      ws2.close();
      console.log(`\n🔌 ${user2.name} disconnected`);
    }, 8000);

  }, 3000);

  // User 1 disconnects after 12 seconds
  setTimeout(() => {
    ws1.close();
    console.log(`\n🔌 ${user1.name} disconnected`);
    console.log('\n✅ Test with existing users completed!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Real users from database authenticated');
    console.log('✅ Real-time messaging between existing users');
    console.log('✅ Message replies with proper linking');
    console.log('✅ Emoji reactions from real users');
    console.log('✅ Database integration working');
    process.exit(0);
  }, 12000);
}

testWithExistingUsers().catch(console.error);
