const WebSocket = require('ws');

// Test JWT token (using the same secret as Java backend)
const jwt = require('jsonwebtoken');
const secretKey = Buffer.from('12341234123412341234123412341234123412341234', 'base64');

// Create a test JWT token
const testToken = jwt.sign({
  sub: '123', // userId
  username: 'testuser',
  email: 'test@example.com',
  exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
}, secretKey, { algorithm: 'HS256' });

console.log('Test JWT Token:', testToken);

// Connect to chat server
const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('Connected to chat server');
  
  // Send authentication
  ws.send(JSON.stringify({
    type: 'authenticate',
    token: testToken
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('Received:', message);
    
    if (message.type === 'authenticated') {
      console.log('✅ Authentication successful!');
      console.log('User:', message.user);
      
      // Test sending a message
      ws.send(JSON.stringify({
        type: 'send_message',
        channelId: 'general',
        content: 'Hello from test script!',
        messageId: `test_${Date.now()}`
      }));
    } else if (message.type === 'auth_error') {
      console.log('❌ Authentication failed:', message.message);
    }
  } catch (error) {
    console.error('Error parsing message:', error);
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', (code, reason) => {
  console.log('Connection closed:', code, reason);
});

// Close after 5 seconds
setTimeout(() => {
  ws.close();
  process.exit(0);
}, 5000);
