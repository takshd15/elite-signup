const WebSocket = require('ws');
const fs = require('fs');

// Load test JWT tokens
const testData = JSON.parse(fs.readFileSync('test-jwt-tokens.json', 'utf8'));

const SERVER_URL = 'ws://localhost:3001';
const TEST_TIMEOUT = 10000;

// Test results tracking
let passedTests = 0;
let failedTests = 0;
let testResults = [];

function logTestResult(testName, passed, details = '', category = 'General') {
  const result = {
    name: testName,
    passed,
    details,
    category,
    timestamp: new Date().toISOString()
  };
  
  testResults.push(result);
  
  if (passed) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.log(`❌ FAIL: ${testName}${details ? ` - ${details}` : ''}`);
    failedTests++;
  }
}

function sendMessage(ws, message) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Message timeout'));
    }, TEST_TIMEOUT);
    
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

function waitForMessage(ws, expectedType, timeout = TEST_TIMEOUT) {
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

function createWebSocketConnection() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(SERVER_URL);
    
    ws.on('open', () => {
      resolve(ws);
    });
    
    ws.on('error', (error) => {
      reject(error);
    });
    
    setTimeout(() => {
      reject(new Error('Connection timeout'));
    }, 5000);
  });
}

async function testProductionMessageFeatures() {
  console.log('🧪 PRODUCTION MESSAGE FEATURES TEST');
  console.log('Testing: Reactions, Editing, Deletion, New Chat Creation');
  console.log('=' .repeat(70));
  
  let aliceWs, bobWs, charlieWs;
  
  try {
    // ============================================================================
    // 1. SETUP: Connect and authenticate users
    // ============================================================================
    console.log('\n🔌 1. SETTING UP CONNECTIONS');
    console.log('-'.repeat(40));
    
    // Connect Alice
    aliceWs = await createWebSocketConnection();
    const aliceAuth = await sendMessage(aliceWs, {
      type: 'authenticate',
      token: testData.valid_tokens[0].token
    });
    
    if (aliceAuth.type !== 'authenticated') {
      throw new Error('Alice authentication failed');
    }
    logTestResult('Alice Authentication', true, '', 'Setup');
    
    // Connect Bob
    bobWs = await createWebSocketConnection();
    const bobAuth = await sendMessage(bobWs, {
      type: 'authenticate',
      token: testData.valid_tokens[1].token
    });
    
    if (bobAuth.type !== 'authenticated') {
      throw new Error('Bob authentication failed');
    }
    logTestResult('Bob Authentication', true, '', 'Setup');
    
    // Connect Charlie (for new chat testing)
    charlieWs = await createWebSocketConnection();
    const charlieAuth = await sendMessage(charlieWs, {
      type: 'authenticate',
      token: testData.valid_tokens[2]?.token || testData.valid_tokens[0].token
    });
    
    if (charlieAuth.type !== 'authenticated') {
      throw new Error('Charlie authentication failed');
    }
    logTestResult('Charlie Authentication', true, '', 'Setup');
    
    console.log('✅ All users authenticated successfully');
    
    // ============================================================================
    // 2. NEW CHAT CREATION TEST
    // ============================================================================
    console.log('\n💬 2. NEW CHAT CREATION TEST');
    console.log('-'.repeat(40));
    
    // Test 2.1: Alice starts a new chat with Charlie (new conversation)
    console.log('Testing new chat creation between Alice and Charlie...');
    
    const newChatResponse = await sendMessage(aliceWs, {
      type: 'initialize_chat',
      recipientId: charlieAuth.user.id.toString()
    });
    
    if (newChatResponse.type === 'chat_initialized') {
      logTestResult('New Chat Creation', true, `Conversation ID: ${newChatResponse.conversationId}`, 'New Chat');
      
      // Check if Charlie received the new chat notification
      try {
        const charlieNotification = await waitForMessage(charlieWs, 'new_chat_initialized', 3000);
        if (charlieNotification.conversationId === newChatResponse.conversationId) {
          logTestResult('New Chat Notification', true, 'Charlie received new chat notification', 'New Chat');
        } else {
          logTestResult('New Chat Notification', false, 'Charlie received wrong conversation ID', 'New Chat');
        }
      } catch (error) {
        logTestResult('New Chat Notification', false, 'Charlie did not receive notification', 'New Chat');
      }
    } else {
      logTestResult('New Chat Creation', false, `Expected chat_initialized, got ${newChatResponse.type}`, 'New Chat');
    }
    
    // Test 2.2: Alice tries to start a chat with herself (should fail)
    console.log('Testing self-chat prevention...');
    
    const selfChatResponse = await sendMessage(aliceWs, {
      type: 'initialize_chat',
      recipientId: aliceAuth.user.id.toString()
    });
    
    if (selfChatResponse.type === 'error' && selfChatResponse.message.includes('cannot start a chat with yourself')) {
      logTestResult('Self Chat Prevention', true, 'Correctly prevented self-chat', 'New Chat');
    } else {
      logTestResult('Self Chat Prevention', false, 'Should have prevented self-chat', 'New Chat');
    }
    
    // ============================================================================
    // 3. MESSAGE REACTIONS TEST
    // ============================================================================
    console.log('\n👍 3. MESSAGE REACTIONS TEST');
    console.log('-'.repeat(40));
    
    // Send a message from Alice to Bob for reaction testing
    const reactionTestMessage = await sendMessage(aliceWs, {
      type: 'send_private_message',
      recipientId: bobAuth.user.id.toString(),
      content: 'This is a message for reaction testing! 🎉'
    });
    
    if (reactionTestMessage.type !== 'private_message_sent') {
      throw new Error('Failed to send message for reaction testing');
    }
    
    // Wait for Bob to receive the message
    await waitForMessage(bobWs, 'new_private_message');
    logTestResult('Message for Reactions', true, 'Message sent and received', 'Reactions');
    
    // Test 3.1: Bob adds a reaction
    console.log('Testing reaction addition...');
    
    const addReactionResponse = await sendMessage(bobWs, {
      type: 'add_reaction',
      messageId: reactionTestMessage.messageId,
      conversationId: reactionTestMessage.conversationId,
      reaction: '👍'
    });
    
    if (addReactionResponse.type === 'reaction_added') {
      logTestResult('Add Reaction', true, 'Reaction added successfully', 'Reactions');
      
      // Check if Alice received the reaction notification
      try {
        const aliceReactionNotification = await waitForMessage(aliceWs, 'reaction_added', 3000);
        if (aliceReactionNotification.messageId === reactionTestMessage.messageId) {
          logTestResult('Reaction Notification', true, 'Alice received reaction notification', 'Reactions');
        } else {
          logTestResult('Reaction Notification', false, 'Wrong message ID in notification', 'Reactions');
        }
      } catch (error) {
        logTestResult('Reaction Notification', false, 'Alice did not receive reaction notification', 'Reactions');
      }
    } else {
      logTestResult('Add Reaction', false, `Expected reaction_added, got ${addReactionResponse.type}`, 'Reactions');
    }
    
    // Test 3.2: Bob adds another reaction
    const addSecondReactionResponse = await sendMessage(bobWs, {
      type: 'add_reaction',
      messageId: reactionTestMessage.messageId,
      conversationId: reactionTestMessage.conversationId,
      reaction: '❤️'
    });
    
    if (addSecondReactionResponse.type === 'reaction_added') {
      logTestResult('Multiple Reactions', true, 'Second reaction added successfully', 'Reactions');
    } else {
      logTestResult('Multiple Reactions', false, 'Failed to add second reaction', 'Reactions');
    }
    
    // Test 3.3: Bob tries to add the same reaction again (should fail)
    const duplicateReactionResponse = await sendMessage(bobWs, {
      type: 'add_reaction',
      messageId: reactionTestMessage.messageId,
      conversationId: reactionTestMessage.conversationId,
      reaction: '👍'
    });
    
    if (duplicateReactionResponse.type === 'error' && duplicateReactionResponse.message.includes('already exists')) {
      logTestResult('Duplicate Reaction Prevention', true, 'Correctly prevented duplicate reaction', 'Reactions');
    } else {
      logTestResult('Duplicate Reaction Prevention', false, 'Should have prevented duplicate reaction', 'Reactions');
    }
    
    // Test 3.4: Bob removes a reaction
    console.log('Testing reaction removal...');
    
    const removeReactionResponse = await sendMessage(bobWs, {
      type: 'remove_reaction',
      messageId: reactionTestMessage.messageId,
      conversationId: reactionTestMessage.conversationId,
      reaction: '👍'
    });
    
    if (removeReactionResponse.type === 'reaction_removed') {
      logTestResult('Remove Reaction', true, 'Reaction removed successfully', 'Reactions');
      
      // Check if Alice received the removal notification
      try {
        const aliceRemovalNotification = await waitForMessage(aliceWs, 'reaction_removed', 3000);
        if (aliceRemovalNotification.messageId === reactionTestMessage.messageId) {
          logTestResult('Reaction Removal Notification', true, 'Alice received removal notification', 'Reactions');
        } else {
          logTestResult('Reaction Removal Notification', false, 'Wrong message ID in removal notification', 'Reactions');
        }
      } catch (error) {
        logTestResult('Reaction Removal Notification', false, 'Alice did not receive removal notification', 'Reactions');
      }
    } else {
      logTestResult('Remove Reaction', false, `Expected reaction_removed, got ${removeReactionResponse.type}`, 'Reactions');
    }
    
    // ============================================================================
    // 4. MESSAGE EDITING TEST
    // ============================================================================
    console.log('\n✏️ 4. MESSAGE EDITING TEST');
    console.log('-'.repeat(40));
    
    // Send a message from Alice to Bob for editing testing
    const editTestMessage = await sendMessage(aliceWs, {
      type: 'send_private_message',
      recipientId: bobAuth.user.id.toString(),
      content: 'This is the original message content that will be edited.'
    });
    
    if (editTestMessage.type !== 'private_message_sent') {
      throw new Error('Failed to send message for editing testing');
    }
    
    // Wait for Bob to receive the message
    await waitForMessage(bobWs, 'new_private_message');
    logTestResult('Message for Editing', true, 'Message sent and received', 'Editing');
    
    // Test 4.1: Alice edits her own message
    console.log('Testing message editing...');
    
    const editResponse = await sendMessage(aliceWs, {
      type: 'edit_message',
      messageId: editTestMessage.messageId,
      conversationId: editTestMessage.conversationId,
      newContent: 'This is the edited message content! ✏️'
    });
    
    if (editResponse.type === 'message_edited') {
      logTestResult('Edit Own Message', true, 'Message edited successfully', 'Editing');
      
      // Check if Bob received the edit notification
      try {
        const bobEditNotification = await waitForMessage(bobWs, 'message_edited', 3000);
        if (bobEditNotification.messageId === editTestMessage.messageId) {
          logTestResult('Edit Notification', true, 'Bob received edit notification', 'Editing');
        } else {
          logTestResult('Edit Notification', false, 'Wrong message ID in edit notification', 'Editing');
        }
      } catch (error) {
        logTestResult('Edit Notification', false, 'Bob did not receive edit notification', 'Editing');
      }
    } else {
      logTestResult('Edit Own Message', false, `Expected message_edited, got ${editResponse.type}`, 'Editing');
    }
    
    // Test 4.2: Bob tries to edit Alice's message (should fail)
    console.log('Testing permission check for editing...');
    
    const bobEditResponse = await sendMessage(bobWs, {
      type: 'edit_message',
      messageId: editTestMessage.messageId,
      conversationId: editTestMessage.conversationId,
      newContent: 'Bob trying to edit Alice\'s message'
    });
    
    if (bobEditResponse.type === 'error' && bobEditResponse.message.includes('Permission denied')) {
      logTestResult('Edit Permission Check', true, 'Correctly prevented editing others\' messages', 'Editing');
    } else {
      logTestResult('Edit Permission Check', false, 'Should have prevented editing others\' messages', 'Editing');
    }
    
    // Test 4.3: Time-based editing restriction
    console.log('Testing time-based editing restriction...');
    
    // Send a message and wait to test time restriction
    const timeTestMessage = await sendMessage(aliceWs, {
      type: 'send_private_message',
      recipientId: bobAuth.user.id.toString(),
      content: 'Message for time restriction test'
    });
    
    console.log('⏰ Waiting 6 seconds to test edit time restriction...');
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const timeRestrictedEdit = await sendMessage(aliceWs, {
      type: 'edit_message',
      messageId: timeTestMessage.messageId,
      conversationId: timeTestMessage.conversationId,
      newContent: 'Edit after time limit'
    });
    
    if (timeRestrictedEdit.type === 'error' && timeRestrictedEdit.message.includes('too old')) {
      logTestResult('Edit Time Restriction', true, 'Correctly enforced 5-minute edit limit', 'Editing');
    } else {
      logTestResult('Edit Time Restriction', false, 'Should have enforced 5-minute edit limit', 'Editing');
    }
    
    // ============================================================================
    // 5. MESSAGE DELETION TEST
    // ============================================================================
    console.log('\n🗑️ 5. MESSAGE DELETION TEST');
    console.log('-'.repeat(40));
    
    // Send a message from Alice to Bob for deletion testing
    const deleteTestMessage = await sendMessage(aliceWs, {
      type: 'send_private_message',
      recipientId: bobAuth.user.id.toString(),
      content: 'This message will be deleted for everyone.'
    });
    
    if (deleteTestMessage.type !== 'private_message_sent') {
      throw new Error('Failed to send message for deletion testing');
    }
    
    // Wait for Bob to receive the message
    await waitForMessage(bobWs, 'new_private_message');
    logTestResult('Message for Deletion', true, 'Message sent and received', 'Deletion');
    
    // Test 5.1: Alice deletes her message for everyone
    console.log('Testing message deletion for everyone...');
    
    const deleteResponse = await sendMessage(aliceWs, {
      type: 'delete_message',
      messageId: deleteTestMessage.messageId,
      conversationId: deleteTestMessage.conversationId,
      deleteForEveryone: true
    });
    
    if (deleteResponse.type === 'message_deleted') {
      logTestResult('Delete for Everyone', true, 'Message deleted for everyone successfully', 'Deletion');
      
      // Check if Bob received the deletion notification
      try {
        const bobDeleteNotification = await waitForMessage(bobWs, 'message_deleted', 3000);
        if (bobDeleteNotification.messageId === deleteTestMessage.messageId) {
          logTestResult('Delete Notification', true, 'Bob received deletion notification', 'Deletion');
        } else {
          logTestResult('Delete Notification', false, 'Wrong message ID in deletion notification', 'Deletion');
        }
      } catch (error) {
        logTestResult('Delete Notification', false, 'Bob did not receive deletion notification', 'Deletion');
      }
    } else {
      logTestResult('Delete for Everyone', false, `Expected message_deleted, got ${deleteResponse.type}`, 'Deletion');
    }
    
    // Test 5.2: Bob tries to delete Alice's message (should fail)
    console.log('Testing permission check for deletion...');
    
    // Send another message for this test
    const permissionTestMessage = await sendMessage(aliceWs, {
      type: 'send_private_message',
      recipientId: bobAuth.user.id.toString(),
      content: 'Message for deletion permission test'
    });
    
    await waitForMessage(bobWs, 'new_private_message');
    
    const bobDeleteResponse = await sendMessage(bobWs, {
      type: 'delete_message',
      messageId: permissionTestMessage.messageId,
      conversationId: permissionTestMessage.conversationId,
      deleteForEveryone: true
    });
    
    if (bobDeleteResponse.type === 'error' && bobDeleteResponse.message.includes('Permission denied')) {
      logTestResult('Delete Permission Check', true, 'Correctly prevented deleting others\' messages', 'Deletion');
    } else {
      logTestResult('Delete Permission Check', false, 'Should have prevented deleting others\' messages', 'Deletion');
    }
    
    // Test 5.3: Delete for self only
    console.log('Testing delete for self only...');
    
    const selfDeleteResponse = await sendMessage(bobWs, {
      type: 'delete_message',
      messageId: permissionTestMessage.messageId,
      conversationId: permissionTestMessage.conversationId,
      deleteForEveryone: false
    });
    
    if (selfDeleteResponse.type === 'message_deleted') {
      logTestResult('Delete for Self', true, 'Message deleted for self successfully', 'Deletion');
    } else {
      logTestResult('Delete for Self', false, `Expected message_deleted, got ${selfDeleteResponse.type}`, 'Deletion');
    }
    
    // ============================================================================
    // 6. COMPREHENSIVE FEATURE INTEGRATION TEST
    // ============================================================================
    console.log('\n🔄 6. COMPREHENSIVE FEATURE INTEGRATION TEST');
    console.log('-'.repeat(40));
    
    // Test a complete workflow: send message, add reaction, edit, then delete
    console.log('Testing complete message lifecycle...');
    
    const lifecycleMessage = await sendMessage(aliceWs, {
      type: 'send_private_message',
      recipientId: bobAuth.user.id.toString(),
      content: 'Complete lifecycle test message'
    });
    
    await waitForMessage(bobWs, 'new_private_message');
    
    // Add reaction
    await sendMessage(bobWs, {
      type: 'add_reaction',
      messageId: lifecycleMessage.messageId,
      conversationId: lifecycleMessage.conversationId,
      reaction: '🎯'
    });
    
    await waitForMessage(aliceWs, 'reaction_added');
    
    // Edit message
    await sendMessage(aliceWs, {
      type: 'edit_message',
      messageId: lifecycleMessage.messageId,
      conversationId: lifecycleMessage.conversationId,
      newContent: 'Edited lifecycle test message'
    });
    
    await waitForMessage(bobWs, 'message_edited');
    
    // Delete message
    await sendMessage(aliceWs, {
      type: 'delete_message',
      messageId: lifecycleMessage.messageId,
      conversationId: lifecycleMessage.conversationId,
      deleteForEveryone: true
    });
    
    await waitForMessage(bobWs, 'message_deleted');
    
    logTestResult('Complete Message Lifecycle', true, 'All features worked together seamlessly', 'Integration');
    
    // ============================================================================
    // 7. TEST SUMMARY
    // ============================================================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 PRODUCTION MESSAGE FEATURES TEST SUMMARY');
    console.log('='.repeat(70));
    
    const categories = ['Setup', 'New Chat', 'Reactions', 'Editing', 'Deletion', 'Integration'];
    
    categories.forEach(category => {
      const categoryTests = testResults.filter(r => r.category === category);
      const passed = categoryTests.filter(r => r.passed).length;
      const total = categoryTests.length;
      const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
      
      console.log(`\n${category.toUpperCase()}: ${passed}/${total} (${percentage}%)`);
      categoryTests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        console.log(`  ${status} ${test.name}`);
        if (!test.passed && test.details) {
          console.log(`     Details: ${test.details}`);
        }
      });
    });
    
    console.log(`\n🎯 OVERALL RESULTS: ${passedTests}/${passedTests + failedTests} tests passed`);
    console.log(`📈 Success Rate: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);
    
    if (failedTests === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Production message features are working correctly.');
    } else {
      console.log(`\n⚠️  ${failedTests} test(s) failed. Please review the details above.`);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Clean up connections
    if (aliceWs) aliceWs.close();
    if (bobWs) bobWs.close();
    if (charlieWs) charlieWs.close();
    console.log('\n🔌 All connections closed');
  }
}

// Run the test
testProductionMessageFeatures();
