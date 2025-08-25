const WebSocket = require('ws');
const fs = require('fs');

// Load test JWT tokens
const testData = JSON.parse(fs.readFileSync('test-jwt-tokens.json', 'utf8'));

const SERVER_URL = 'ws://localhost:3001';

function sendMessage(ws, message) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Message timeout'));
    }, 5000);
    
    const messageHandler = (data) => {
      try {
        const response = JSON.parse(data);
        if (response.type === 'connected') {
          return; // Continue waiting
        }
        clearTimeout(timeout);
        ws.removeListener('message', messageHandler);
        resolve(response);
      } catch (error) {
        clearTimeout(timeout);
        ws.removeListener('message', messageHandler);
        reject(new Error('Invalid JSON response'));
      }
    };
    
    ws.on('message', messageHandler);
    ws.send(JSON.stringify(message));
  });
}

function waitForMessage(ws, expectedType, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${expectedType}`));
    }, timeout);
    
    const messageHandler = (data) => {
      try {
        const response = JSON.parse(data);
        if (response.type === expectedType) {
          clearTimeout(timer);
          ws.removeListener('message', messageHandler);
          resolve(response);
        }
      } catch (error) {
        // Continue waiting
      }
    };
    
    ws.on('message', messageHandler);
  });
}

async function testEnhancedFeatures() {
  console.log('🧪 Testing Enhanced Features: Edit, Delete, Reactions');
  console.log('=' .repeat(60));
  
  let aliceWs, bobWs;
  let testResults = {
    messageEdit: { passed: false, details: '' },
    messageDelete: { passed: false, details: '' },
    reactions: { passed: false, details: '' },
    permissions: { passed: false, details: '' }
  };
  
  try {
    // Connect and authenticate both users
    console.log('1. Connecting and authenticating users...');
    
    aliceWs = new WebSocket(SERVER_URL);
    await new Promise((resolve) => aliceWs.on('open', resolve));
    
    const aliceAuth = await sendMessage(aliceWs, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    bobWs = new WebSocket(SERVER_URL);
    await new Promise((resolve) => bobWs.on('open', resolve));
    
    const bobAuth = await sendMessage(bobWs, {
      type: 'authenticate',
      token: testData.valid_tokens[1].token
    });
    
    if (aliceAuth.type !== 'authenticated' || bobAuth.type !== 'authenticated') {
      throw new Error('Authentication failed');
    }
    
    console.log('✅ Both users authenticated successfully');
    
    // Test 1: Message Editing
    console.log('\n2. Testing Message Editing...');
    
    // Send initial message from Alice to Bob
    const initialMessage = await sendMessage(aliceWs, {
      type: 'send_private_message',
      recipientId: bobAuth.user.id.toString(),
      content: 'Original message content'
    });
    
    if (initialMessage.type !== 'private_message_sent') {
      throw new Error('Failed to send initial message');
    }
    
    console.log('📝 Initial message sent:', initialMessage.messageId);
    
    // Wait for Bob to receive the message
    const bobReceivedMessage = await waitForMessage(bobWs, 'new_private_message');
    console.log('📨 Bob received message');
    
    // Edit the message from Alice
    const editResponse = await sendMessage(aliceWs, {
      type: 'edit_message',
      messageId: initialMessage.messageId,
      conversationId: initialMessage.conversationId,
      newContent: 'Edited message content'
    });
    
    if (editResponse.type === 'message_edited') {
      console.log('✅ Message edited successfully');
      testResults.messageEdit.passed = true;
      testResults.messageEdit.details = 'Message was edited successfully';
      
      // Check if Bob received the edit notification
      const bobEditNotification = await waitForMessage(bobWs, 'message_edited');
      if (bobEditNotification.messageId === initialMessage.messageId) {
        console.log('✅ Bob received edit notification');
      } else {
        console.log('❌ Bob did not receive edit notification');
        testResults.messageEdit.passed = false;
        testResults.messageEdit.details = 'Edit notification not received by recipient';
      }
    } else {
      console.log('❌ Message edit failed:', editResponse);
      testResults.messageEdit.details = `Edit failed: ${editResponse.message || 'Unknown error'}`;
    }
    
    // Test 2: Message Reactions
    console.log('\n3. Testing Message Reactions...');
    
    // Bob adds a reaction to Alice's message
    const addReactionResponse = await sendMessage(bobWs, {
      type: 'add_reaction',
      messageId: initialMessage.messageId,
      conversationId: initialMessage.conversationId,
      reaction: '👍'
    });
    
    if (addReactionResponse.type === 'reaction_added') {
      console.log('✅ Reaction added successfully');
      
      // Check if Alice received the reaction notification
      const aliceReactionNotification = await waitForMessage(aliceWs, 'reaction_added');
      if (aliceReactionNotification.messageId === initialMessage.messageId) {
        console.log('✅ Alice received reaction notification');
        testResults.reactions.passed = true;
        testResults.reactions.details = 'Reaction added and notification sent successfully';
      } else {
        console.log('❌ Alice did not receive reaction notification');
        testResults.reactions.details = 'Reaction notification not received by message sender';
      }
    } else {
      console.log('❌ Adding reaction failed:', addReactionResponse);
      testResults.reactions.details = `Add reaction failed: ${addReactionResponse.message || 'Unknown error'}`;
    }
    
    // Test removing reaction
    const removeReactionResponse = await sendMessage(bobWs, {
      type: 'remove_reaction',
      messageId: initialMessage.messageId,
      conversationId: initialMessage.conversationId,
      reaction: '👍'
    });
    
    if (removeReactionResponse.type === 'reaction_removed') {
      console.log('✅ Reaction removed successfully');
      
      // Check if Alice received the removal notification
      const aliceRemovalNotification = await waitForMessage(aliceWs, 'reaction_removed');
      if (aliceRemovalNotification.messageId === initialMessage.messageId) {
        console.log('✅ Alice received reaction removal notification');
      } else {
        console.log('❌ Alice did not receive reaction removal notification');
      }
    } else {
      console.log('❌ Removing reaction failed:', removeReactionResponse);
    }
    
    // Test 3: Message Deletion
    console.log('\n4. Testing Message Deletion...');
    
    // Send a new message for deletion test
    const deleteTestMessage = await sendMessage(aliceWs, {
      type: 'send_private_message',
      recipientId: bobAuth.user.id.toString(),
      content: 'Message to be deleted'
    });
    
    if (deleteTestMessage.type !== 'private_message_sent') {
      throw new Error('Failed to send message for deletion test');
    }
    
    console.log('📝 Message for deletion sent:', deleteTestMessage.messageId);
    
    // Wait for Bob to receive it
    await waitForMessage(bobWs, 'new_private_message');
    
    // Delete the message (for everyone)
    const deleteResponse = await sendMessage(aliceWs, {
      type: 'delete_message',
      messageId: deleteTestMessage.messageId,
      conversationId: deleteTestMessage.conversationId,
      deleteForEveryone: true
    });
    
    if (deleteResponse.type === 'message_deleted') {
      console.log('✅ Message deleted successfully');
      
      // Check if Bob received the deletion notification
      const bobDeleteNotification = await waitForMessage(bobWs, 'message_deleted');
      if (bobDeleteNotification.messageId === deleteTestMessage.messageId) {
        console.log('✅ Bob received deletion notification');
        testResults.messageDelete.passed = true;
        testResults.messageDelete.details = 'Message deleted and notification sent successfully';
      } else {
        console.log('❌ Bob did not receive deletion notification');
        testResults.messageDelete.details = 'Deletion notification not received by recipient';
      }
    } else {
      console.log('❌ Message deletion failed:', deleteResponse);
      testResults.messageDelete.details = `Deletion failed: ${deleteResponse.message || 'Unknown error'}`;
    }
    
    // Test 4: Permission Checks
    console.log('\n5. Testing Permission Checks...');
    
    // Send a message from Bob to Alice
    const bobMessage = await sendMessage(bobWs, {
      type: 'send_private_message',
      recipientId: aliceAuth.user.id.toString(),
      content: 'Bob\'s message for permission test'
    });
    
    if (bobMessage.type !== 'private_message_sent') {
      throw new Error('Failed to send Bob\'s message');
    }
    
    // Alice tries to edit Bob's message (should fail)
    const aliceEditBobMessage = await sendMessage(aliceWs, {
      type: 'edit_message',
      messageId: bobMessage.messageId,
      conversationId: bobMessage.conversationId,
      newContent: 'Alice trying to edit Bob\'s message'
    });
    
    if (aliceEditBobMessage.type === 'error' && aliceEditBobMessage.message.includes('Permission denied')) {
      console.log('✅ Permission check for editing passed');
      
      // Alice tries to delete Bob's message (should fail)
      const aliceDeleteBobMessage = await sendMessage(aliceWs, {
        type: 'delete_message',
        messageId: bobMessage.messageId,
        conversationId: bobMessage.conversationId,
        deleteForEveryone: true
      });
      
      if (aliceDeleteBobMessage.type === 'error' && aliceDeleteBobMessage.message.includes('Permission denied')) {
        console.log('✅ Permission check for deletion passed');
        testResults.permissions.passed = true;
        testResults.permissions.details = 'Permission checks working correctly';
      } else {
        console.log('❌ Permission check for deletion failed');
        testResults.permissions.details = 'Deletion permission check failed';
      }
    } else {
      console.log('❌ Permission check for editing failed');
      testResults.permissions.details = 'Editing permission check failed';
    }
    
    // Test 5: Time-based restrictions
    console.log('\n6. Testing Time-based Restrictions...');
    
    // Send a message and wait to test time restrictions
    const timeTestMessage = await sendMessage(aliceWs, {
      type: 'send_private_message',
      recipientId: bobAuth.user.id.toString(),
      content: 'Message for time restriction test'
    });
    
    console.log('⏰ Waiting 6 seconds to test edit time restriction...');
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    // Try to edit after 5 minutes (should fail)
    const timeRestrictedEdit = await sendMessage(aliceWs, {
      type: 'edit_message',
      messageId: timeTestMessage.messageId,
      conversationId: timeTestMessage.conversationId,
      newContent: 'Edit after time limit'
    });
    
    if (timeRestrictedEdit.type === 'error' && timeRestrictedEdit.message.includes('too old')) {
      console.log('✅ Time restriction for editing working correctly');
    } else {
      console.log('❌ Time restriction for editing not working');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    Object.entries(testResults).forEach(([test, result]) => {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${test.toUpperCase()}: ${status}`);
      if (!result.passed && result.details) {
        console.log(`   Details: ${result.details}`);
      }
    });
    
    const passedTests = Object.values(testResults).filter(r => r.passed).length;
    const totalTests = Object.keys(testResults).length;
    console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    // Clean up connections
    if (aliceWs) aliceWs.close();
    if (bobWs) bobWs.close();
    console.log('\n🔌 Connections closed');
  }
}

// Run the test
testEnhancedFeatures();
