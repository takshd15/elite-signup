const WebSocket = require('ws');
const fs = require('fs');

// Load test JWT tokens
let testTokens;
try {
  testTokens = JSON.parse(fs.readFileSync('test-jwt-tokens.json', 'utf8'));
} catch (error) {
  console.error('❌ Could not load test JWT tokens. Please run the server first to generate them.');
  process.exit(1);
}

const SERVER_URL = 'ws://localhost:3001';
const testResults = {
  messageEditing: { passed: 0, failed: 0, tests: [] },
  messageDeletion: { passed: 0, failed: 0, tests: [] },
  conversationDeletion: { passed: 0, failed: 0, tests: [] }
};

// Test users
const alice = {
  name: 'Alice',
  token: testTokens.valid_tokens[0].token,
  ws: null,
  authenticated: false,
  messages: []
};

const bob = {
  name: 'Bob', 
  token: testTokens.valid_tokens[1].token,
  ws: null,
  authenticated: false,
  messages: []
};

// Helper function to create WebSocket connection
function createConnection(user) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(SERVER_URL);
    
    ws.on('open', () => {
      console.log(`✅ ${user.name} connected`);
      user.ws = ws;
      resolve(ws);
    });
    
    ws.on('error', (error) => {
      console.error(`❌ ${user.name} connection error:`, error.message);
      reject(error);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(user, message);
      } catch (error) {
        console.error(`❌ ${user.name} message parse error:`, error.message);
      }
    });
  });
}

// Handle incoming messages
function handleMessage(user, message) {
  switch (message.type) {
    case 'auth_success':
      user.authenticated = true;
      console.log(`✅ ${user.name} authenticated successfully`);
      break;
      
    case 'private_message_sent':
      user.messages.push({
        id: message.messageId,
        content: message.content,
        conversationId: message.conversationId,
        timestamp: message.timestamp
      });
      console.log(`📨 ${user.name} received message confirmation: ${message.messageId}`);
      break;
      
    case 'message_edited':
      console.log(`✏️ ${user.name} received edit notification: ${message.messageId} -> "${message.newContent}"`);
      // Update local message
      const editedMsg = user.messages.find(m => m.id === message.messageId);
      if (editedMsg) {
        editedMsg.content = message.newContent;
        editedMsg.edited = true;
        editedMsg.editedAt = message.timestamp;
      }
      break;
      
    case 'message_deleted':
      console.log(`🗑️ ${user.name} received deletion notification: ${message.messageId} (for everyone: ${message.deleteForEveryone})`);
      // Remove from local messages if deleted for everyone
      if (message.deleteForEveryone) {
        user.messages = user.messages.filter(m => m.id !== message.messageId);
      }
      break;
      
    case 'conversation_deleted':
      console.log(`🗑️ ${user.name} received conversation deletion: ${message.conversationId} (for everyone: ${message.deleteForEveryone})`);
      break;
      
    case 'error':
      console.error(`❌ ${user.name} received error:`, message.message, message.details);
      break;
      
    default:
      console.log(`📨 ${user.name} received:`, message.type);
  }
}

// Send message
function sendMessage(user, content, conversationId, recipientId) {
  return new Promise((resolve) => {
    const message = {
      type: 'send_private_message',
      content: content,
      conversationId: conversationId,
      recipientId: recipientId
    };
    
    user.ws.send(JSON.stringify(message));
    resolve();
  });
}

// Edit message
function editMessage(user, messageId, newContent, conversationId) {
  return new Promise((resolve) => {
    const message = {
      type: 'edit_message',
      messageId: messageId,
      newContent: newContent,
      conversationId: conversationId
    };
    
    user.ws.send(JSON.stringify(message));
    resolve();
  });
}

// Delete message
function deleteMessage(user, messageId, conversationId, deleteForEveryone = false) {
  return new Promise((resolve) => {
    const message = {
      type: 'delete_message',
      messageId: messageId,
      conversationId: conversationId,
      deleteForEveryone: deleteForEveryone
    };
    
    user.ws.send(JSON.stringify(message));
    resolve();
  });
}

// Delete conversation
function deleteConversation(user, conversationId, deleteForEveryone = false) {
  return new Promise((resolve) => {
    const message = {
      type: 'delete_conversation',
      conversationId: conversationId,
      deleteForEveryone: deleteForEveryone
    };
    
    user.ws.send(JSON.stringify(message));
    resolve();
  });
}

// Authenticate user
function authenticateUser(user) {
  return new Promise((resolve) => {
    const authMessage = {
      type: 'authenticate',
      token: user.token
    };
    
    user.ws.send(JSON.stringify(authMessage));
    resolve();
  });
}

// Test message editing
async function testMessageEditing() {
  console.log('\n🧪 Testing Message Editing...');
  
  try {
    // Test 1: Edit own message within time limit
    console.log('Test 1: Edit own message within 5 minutes');
    const testMessage = alice.messages[0];
    if (testMessage) {
      await editMessage(alice, testMessage.id, 'This message has been edited!', testMessage.conversationId);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const editedMsg = alice.messages.find(m => m.id === testMessage.id);
      if (editedMsg && editedMsg.content === 'This message has been edited!') {
        testResults.messageEditing.passed++;
        testResults.messageEditing.tests.push('✅ Edit own message within time limit');
      } else {
        testResults.messageEditing.failed++;
        testResults.messageEditing.tests.push('❌ Edit own message within time limit');
      }
    }
    
    // Test 2: Try to edit someone else's message
    console.log('Test 2: Try to edit someone else\'s message');
    const bobMessage = bob.messages[0];
    if (bobMessage) {
      await editMessage(alice, bobMessage.id, 'Hacked message!', bobMessage.conversationId);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Should not be edited
      const stillOriginal = bob.messages.find(m => m.id === bobMessage.id);
      if (stillOriginal && stillOriginal.content !== 'Hacked message!') {
        testResults.messageEditing.passed++;
        testResults.messageEditing.tests.push('✅ Cannot edit someone else\'s message');
      } else {
        testResults.messageEditing.failed++;
        testResults.messageEditing.tests.push('❌ Cannot edit someone else\'s message');
      }
    }
    
  } catch (error) {
    console.error('❌ Message editing test error:', error.message);
    testResults.messageEditing.failed++;
    testResults.messageEditing.tests.push('❌ Message editing test error');
  }
}

// Test message deletion
async function testMessageDeletion() {
  console.log('\n🧪 Testing Message Deletion...');
  
  try {
    // Test 1: Delete message for self only
    console.log('Test 1: Delete message for self only');
    const testMessage = alice.messages[1];
    if (testMessage) {
      await deleteMessage(alice, testMessage.id, testMessage.conversationId, false);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Message should still exist for Bob
      const bobStillSees = bob.messages.find(m => m.id === testMessage.id);
      if (bobStillSees) {
        testResults.messageDeletion.passed++;
        testResults.messageDeletion.tests.push('✅ Delete message for self only');
      } else {
        testResults.messageDeletion.failed++;
        testResults.messageDeletion.tests.push('❌ Delete message for self only');
      }
    }
    
    // Test 2: Delete message for everyone
    console.log('Test 2: Delete message for everyone');
    const testMessage2 = alice.messages[2];
    if (testMessage2) {
      await deleteMessage(alice, testMessage2.id, testMessage2.conversationId, true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Message should be removed from both users
      const aliceStillSees = alice.messages.find(m => m.id === testMessage2.id);
      const bobStillSees = bob.messages.find(m => m.id === testMessage2.id);
      
      if (!aliceStillSees && !bobStillSees) {
        testResults.messageDeletion.passed++;
        testResults.messageDeletion.tests.push('✅ Delete message for everyone');
      } else {
        testResults.messageDeletion.failed++;
        testResults.messageDeletion.tests.push('❌ Delete message for everyone');
      }
    }
    
    // Test 3: Try to delete someone else's message for everyone
    console.log('Test 3: Try to delete someone else\'s message for everyone');
    const bobMessage = bob.messages[0];
    if (bobMessage) {
      await deleteMessage(alice, bobMessage.id, bobMessage.conversationId, true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Should not be deleted
      const stillExists = bob.messages.find(m => m.id === bobMessage.id);
      if (stillExists) {
        testResults.messageDeletion.passed++;
        testResults.messageDeletion.tests.push('✅ Cannot delete someone else\'s message for everyone');
      } else {
        testResults.messageDeletion.failed++;
        testResults.messageDeletion.tests.push('❌ Cannot delete someone else\'s message for everyone');
      }
    }
    
  } catch (error) {
    console.error('❌ Message deletion test error:', error.message);
    testResults.messageDeletion.failed++;
    testResults.messageDeletion.tests.push('❌ Message deletion test error');
  }
}

// Test conversation deletion
async function testConversationDeletion() {
  console.log('\n🧪 Testing Conversation Deletion...');
  
  try {
    // Test 1: Delete conversation for self only
    console.log('Test 1: Delete conversation for self only');
    const conversationId = 'conv_user-1_user-2';
    
    await deleteConversation(alice, conversationId, false);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Conversation should still exist for Bob
    const bobStillHasMessages = bob.messages.length > 0;
    if (bobStillHasMessages) {
      testResults.conversationDeletion.passed++;
      testResults.conversationDeletion.tests.push('✅ Delete conversation for self only');
    } else {
      testResults.conversationDeletion.failed++;
      testResults.conversationDeletion.tests.push('❌ Delete conversation for self only');
    }
    
    // Test 2: Delete conversation for everyone
    console.log('Test 2: Delete conversation for everyone');
    const conversationId2 = 'conv_user-1_123';
    
    await deleteConversation(alice, conversationId2, true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Conversation should be deleted for everyone
    testResults.conversationDeletion.passed++;
    testResults.conversationDeletion.tests.push('✅ Delete conversation for everyone');
    
  } catch (error) {
    console.error('❌ Conversation deletion test error:', error.message);
    testResults.conversationDeletion.failed++;
    testResults.conversationDeletion.tests.push('❌ Conversation deletion test error');
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Message Editing and Deletion Tests...\n');
  
  try {
    // Create connections
    console.log('📡 Creating WebSocket connections...');
    await createConnection(alice);
    await createConnection(bob);
    
    // Authenticate users
    console.log('🔐 Authenticating users...');
    await authenticateUser(alice);
    await authenticateUser(bob);
    
    // Wait for authentication
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (!alice.authenticated || !bob.authenticated) {
      console.error('❌ Authentication failed');
      return;
    }
    
    // Send some test messages
    console.log('📨 Sending test messages...');
    await sendMessage(alice, 'Hello Bob! This is message 1', 'conv_user-1_user-2', '2');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await sendMessage(alice, 'This is message 2 that will be edited', 'conv_user-1_user-2', '2');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await sendMessage(alice, 'This is message 3 that will be deleted for self', 'conv_user-1_user-2', '2');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await sendMessage(alice, 'This is message 4 that will be deleted for everyone', 'conv_user-1_user-2', '2');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await sendMessage(bob, 'Hi Alice! This is Bob\'s message', 'conv_user-1_user-2', '1');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await sendMessage(alice, 'Message for conversation that will be deleted', 'conv_user-1_123', '3');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Run tests
    await testMessageEditing();
    await testMessageDeletion();
    await testConversationDeletion();
    
    // Print results
    console.log('\n📊 Test Results:');
    console.log('================');
    
    console.log('\n✏️ Message Editing Tests:');
    testResults.messageEditing.tests.forEach(test => console.log(`  ${test}`));
    console.log(`  Passed: ${testResults.messageEditing.passed}, Failed: ${testResults.messageEditing.failed}`);
    
    console.log('\n🗑️ Message Deletion Tests:');
    testResults.messageDeletion.tests.forEach(test => console.log(`  ${test}`));
    console.log(`  Passed: ${testResults.messageDeletion.passed}, Failed: ${testResults.messageDeletion.failed}`);
    
    console.log('\n🗑️ Conversation Deletion Tests:');
    testResults.conversationDeletion.tests.forEach(test => console.log(`  ${test}`));
    console.log(`  Passed: ${testResults.conversationDeletion.passed}, Failed: ${testResults.conversationDeletion.failed}`);
    
    const totalPassed = testResults.messageEditing.passed + testResults.messageDeletion.passed + testResults.conversationDeletion.passed;
    const totalFailed = testResults.messageEditing.failed + testResults.messageDeletion.failed + testResults.conversationDeletion.failed;
    
    console.log('\n🎯 Overall Results:');
    console.log(`  Total Passed: ${totalPassed}`);
    console.log(`  Total Failed: ${totalFailed}`);
    console.log(`  Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 All tests passed! Message editing and deletion features are working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Check the implementation.');
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error.message);
  } finally {
    // Close connections
    if (alice.ws) alice.ws.close();
    if (bob.ws) bob.ws.close();
    console.log('\n✅ Test completed. Connections closed.');
  }
}

// Run the tests
runTests().catch(console.error);
