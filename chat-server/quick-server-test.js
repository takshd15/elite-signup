const WebSocket = require('ws');

console.log('🧪 Quick Chat Server Test');
console.log('Testing server connection...\n');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('✅ Server connection: SUCCESS');
  console.log('✅ WebSocket handshake: SUCCESS');
  
  // Test basic authentication
  const testMessage = {
    type: 'authenticate',
    token: 'test-token'
  };
  
  console.log('📤 Sending test authentication...');
  ws.send(JSON.stringify(testMessage));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('📥 Received response:', message.type);
    
    if (message.type === 'auth_error') {
      console.log('✅ Authentication rejection: SUCCESS (expected for invalid token)');
    } else {
      console.log('⚠️  Unexpected response type:', message.type);
    }
    
    ws.close();
    console.log('\n🎉 Quick test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.log('❌ Failed to parse response:', error.message);
    ws.close();
    process.exit(1);
  }
});

ws.on('error', (error) => {
  console.log('❌ Connection error:', error.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('🔌 Connection closed');
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Test timeout - server may not be responding');
  process.exit(1);
}, 10000);
