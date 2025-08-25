const WebSocket = require('ws');

const SERVER_URL = 'ws://localhost:3001';

console.log('🧪 Simple Connection Test');
console.log('Testing basic WebSocket connection to chat server...');

async function testConnection() {
  try {
    console.log('Connecting to:', SERVER_URL);
    
    const ws = new WebSocket(SERVER_URL);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connection opened successfully!');
      
      // Send a simple ping message
      ws.send(JSON.stringify({ type: 'ping' }));
    });
    
    ws.on('message', (data) => {
      try {
        const response = JSON.parse(data);
        console.log('📨 Received response:', response);
        
        if (response.type === 'pong') {
          console.log('✅ Server responded with pong - server is working!');
        } else {
          console.log('📝 Server sent:', response.type);
        }
        
        // Close the connection after receiving response
        setTimeout(() => {
          ws.close();
          console.log('🔌 Connection closed');
        }, 1000);
        
      } catch (error) {
        console.log('📨 Received raw data:', data.toString());
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.error('❌ Connection timeout - server might not be running');
        ws.close();
      }
    }, 5000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testConnection();
