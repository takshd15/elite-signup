#!/usr/bin/env node

/**
 * Complete Chat System Integration Test
 * Tests both Java Backend REST API and Node.js WebSocket Chat Server
 */

const WebSocket = require('ws');
const http = require('http');
const { Client } = require('pg');

// Configuration
const JAVA_BACKEND_URL = 'http://localhost:8080';
const CHAT_SERVER_URL = 'ws://localhost:3001';
const DB_CONFIG = {
  host: 'cd6emofiekhlj.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com',
  port: 5432,
  database: 'd4ukv7mqkkc9i1',
  user: 'u2eb6vlhflq6bt',
  password: 'pe9512a0cbf2bc2eee176022c82836beedc48733196d06484e5dc69e2754f5a79',
  ssl: { rejectUnauthorized: false }
};

// Test results
const results = {
  javaBackend: false,
  webSocketServer: false,
  database: false,
  integration: false
};

console.log('🚀 Starting Complete Chat System Integration Test...\n');

// Test Java Backend REST API
async function testJavaBackend() {
  console.log('🔌 Testing Java Backend REST API...\n');
  
  try {
    // Test status endpoint
    console.log('📡 Testing Backend Status...');
    const statusResponse = await makeRequest(`${JAVA_BACKEND_URL}/v1/status`);
    if (statusResponse.statusCode === 200) {
      console.log('✅ Java Backend status: OK');
      results.javaBackend = true;
    } else {
      console.log(`❌ Java Backend status failed: ${statusResponse.statusCode}`);
    }
    
    // Test chat channels endpoint
    console.log('📡 Testing Chat Channels...');
    const channelsResponse = await makeRequest(`${JAVA_BACKEND_URL}/v1/chat/channels`);
    if (channelsResponse.statusCode === 200) {
      console.log('✅ Chat channels endpoint: OK');
    } else {
      console.log(`❌ Chat channels failed: ${channelsResponse.statusCode}`);
    }
    
  } catch (error) {
    console.log(`❌ Java Backend test failed: ${error.message}`);
  }
}

// Test Node.js WebSocket Chat Server
async function testWebSocketServer() {
  console.log('\n🔌 Testing Node.js WebSocket Chat Server...\n');
  
  try {
    // Test WebSocket connection
    console.log('📡 Connecting to WebSocket server...');
    const ws = new WebSocket(CHAT_SERVER_URL);
    
    return new Promise((resolve) => {
      ws.on('open', () => {
        console.log('✅ WebSocket connection: OK');
        
        // Test health endpoint
        testHealthEndpoint().then(() => {
          ws.close();
          results.webSocketServer = true;
          resolve();
        });
      });
      
      ws.on('error', (error) => {
        console.log(`❌ WebSocket error:\n${error.message}`);
        resolve();
      });
      
      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.log('❌ WebSocket connection timeout');
          ws.close();
          resolve();
        }
      }, 5000);
    });
    
  } catch (error) {
    console.log(`❌ WebSocket test failed: ${error.message}`);
  }
}

// Test health endpoint
async function testHealthEndpoint() {
  try {
    const healthResponse = await makeRequest('http://localhost:3001/health');
    if (healthResponse.statusCode === 200) {
      console.log('✅ Chat server health: OK');
    } else {
      console.log(`❌ Chat server health failed: ${healthResponse.statusCode}`);
    }
  } catch (error) {
    console.log(`❌ Health endpoint test failed: ${error.message}`);
  }
}

// Test Database Integration
async function testDatabaseIntegration() {
  console.log('\n🗄️ Testing Database Integration...\n');
  
  try {
    const client = new Client(DB_CONFIG);
    await client.connect();
    console.log('✅ Database connection successful!');
    
    // Check if chat tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'chat_%'
      ORDER BY table_name
    `;
    
    const tablesResult = await client.query(tablesQuery);
    const chatTables = tablesResult.rows.map(row => row.table_name);
    
    console.log(`📊 Found ${chatTables.length} chat tables:`);
    chatTables.forEach(table => console.log(`   - ${table}`));
    
    // Check if channels exist
    const channelsQuery = 'SELECT COUNT(*) as count FROM chat_channels';
    const channelsResult = await client.query(channelsQuery);
    const channelCount = parseInt(channelsResult.rows[0].count);
    console.log(`📢 Found ${channelCount} channels in database`);
    
    // Check if messages exist
    const messagesQuery = 'SELECT COUNT(*) as count FROM chat_messages';
    const messagesResult = await client.query(messagesQuery);
    const messageCount = parseInt(messagesResult.rows[0].count);
    console.log(`💬 Found ${messageCount} recent messages in database`);
    
    await client.end();
    results.database = true;
    console.log('✅ Database integration test completed!');
    
  } catch (error) {
    console.log(`❌ Database test failed: ${error.message}`);
  }
}

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Run all tests
async function runAllTests() {
  await testJavaBackend();
  await testWebSocketServer();
  await testDatabaseIntegration();
  
  // Integration test summary
  console.log('\n📋 Integration Test Summary:');
  console.log(`   Java Backend: ${results.javaBackend ? '✅ Working' : '❌ Failed'}`);
  console.log(`   WebSocket Server: ${results.webSocketServer ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Database: ${results.database ? '✅ Working' : '❌ Failed'}`);
  
  const allWorking = results.javaBackend && results.webSocketServer && results.database;
  
  if (allWorking) {
    console.log('\n🎉 All systems are working! Integration successful!');
    console.log('\n📝 Next steps:');
    console.log('1. Java Backend is running on port 8080');
    console.log('2. Chat Server is running on port 3001');
    console.log('3. Database is connected and tables are ready');
    console.log('4. You can now use the chat system!');
  } else {
    console.log('\n⚠️ Some systems need attention. Check the logs above.');
  }
}

// Run the tests
runAllTests().catch(console.error);
