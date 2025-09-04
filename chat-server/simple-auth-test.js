const WebSocket = require('ws');
const fs = require('fs');

// Load test JWT tokens
const testTokens = JSON.parse(fs.readFileSync('./test-jwt-tokens.json', 'utf8'));

console.log('🔐 Simple Authentication Test');
console.log('=============================');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('✅ Connected to server');
  
  // Wait a moment then authenticate
  setTimeout(() => {
    console.log('🔑 Sending authentication...');
    ws.send(JSON.stringify({
      type: 'authenticate',
      token: testTokens.valid_tokens[0].token
    }));
  }, 1000);
});

ws.on('message', (data) => {
  const response = JSON.parse(data);
  console.log('📨 Received:', response.type);
  
  if (response.type === 'connected') {
    console.log('📝 Server message:', response.message);
    console.log('🔐 Requires auth:', response.requiresAuth);
  } else if (response.type === 'auth_success') {
    console.log('✅ Authentication successful!');
    console.log('👤 User:', response.user.username);
  } else if (response.type === 'auth_error') {
    console.log('❌ Authentication failed:', response.message);
  }
});

ws.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

ws.on('close', () => {
  console.log('🔌 Connection closed');
});

setTimeout(() => {
  ws.close();
}, 5000);
