const http = require('http');

console.log('🧪 Testing if port 3001 is available...');

const testServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Test server is working!');
});

testServer.listen(3001, () => {
  console.log('✅ Port 3001 is available and test server is listening');
  console.log('🚀 Test server running on http://localhost:3001');
  
  // Close the test server after 5 seconds
  setTimeout(() => {
    testServer.close(() => {
      console.log('🔌 Test server closed');
    });
  }, 5000);
});

testServer.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error('❌ Port 3001 is already in use');
  } else {
    console.error('❌ Error starting test server:', error.message);
  }
});
