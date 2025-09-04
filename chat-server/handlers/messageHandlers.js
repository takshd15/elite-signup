const crypto = require('crypto');
const { verifyJWTWithBackend } = require('../security/jwtUtils');
const { savePrivateMessageToDatabase, loadPrivateMessagesFromDatabase } = require('../database/messageOperations');
const { checkMessageModeration } = require('../security/contentModeration');
const InputValidator = require('../security/inputValidator');
const { getRedisClient, isRedisConnected } = require('../config/redis');

// Generate conversation ID for two users
function generateConversationId(userId1, userId2) {
  const sortedIds = [userId1, userId2].sort();
  return `conv_${sortedIds[0]}_${sortedIds[1]}`;
}

async function handleAuthentication(ws, data, clientId, clients, userConnections, sessions, metrics) {
  const { token } = data;
  
  // Get client IP from stored client information
  const client = clients.get(clientId);
  const clientIp = client ? client.clientIp : 'unknown';
  
  if (!token) {
    ws.send(JSON.stringify({
      type: 'auth_error',
      message: 'Authentication token required',
      details: 'Please provide a valid JWT token in the authentication request.'
    }));
    return;
  }
  
  // Enhanced token validation
  const tokenValidation = InputValidator.validateJWTToken(token);
  if (!tokenValidation.isValid) {
    if (client) {
      client.failedAuthAttempts = (client.failedAuthAttempts || 0) + 1;
    }
    ws.send(JSON.stringify({
      type: 'auth_error',
      message: tokenValidation.error
    }));
    return;
  }
  
  // First verify JWT with Java backend
  const verificationResult = await verifyJWTWithBackend(token, clientIp, require('../config/database').dbPool);
  
  if (!verificationResult.valid) {
    if (client) {
      client.failedAuthAttempts = (client.failedAuthAttempts || 0) + 1;
    }
    ws.send(JSON.stringify({
      type: 'auth_error',
      message: verificationResult.error || 'Token validation failed'
    }));
    console.warn(`Authentication failed: ${verificationResult.error}`);
    return;
  }
  
  // Use user data from backend verification
  const user = verificationResult.user;
  
  // Check if user is already connected elsewhere
  const existingSession = sessions.get(user.userId);
  if (existingSession && existingSession !== clientId) {
    // Notify existing connection to disconnect
    const existingClient = clients.get(existingSession);
    if (existingClient && existingClient.ws.readyState === require('ws').OPEN) {
      existingClient.ws.send(JSON.stringify({
        type: 'session_conflict',
        message: 'You have been logged in elsewhere'
      }));
      existingClient.ws.close(1000, 'Session conflict');
    }
  }
  
  // Update client information with user data
  const existingClient = clients.get(clientId);
  if (existingClient) {
    existingClient.user = user;
    existingClient.lastActivity = Date.now();
    
    // Update Redis session with user data
    if (isRedisConnected()) {
      try {
        const redisClient = getRedisClient();
        await redisClient.setEx(`session:${clientId}`, 3600, JSON.stringify({
          clientIp: existingClient.clientIp,
          lastActivity: existingClient.lastActivity,
          connected: true,
          messageCount: existingClient.messageCount || 0,
          user: user
        }));
        
        // Also store user session mapping
        await redisClient.setEx(`user_session:${user.userId}`, 3600, clientId);
      } catch (redisError) {
        console.warn('Failed to update user session in Redis:', redisError.message);
      }
    }
  }
  
  // Store session in memory
  sessions.set(user.userId, clientId);
  userConnections.set(user.userId, clientId);
  
  metrics.activeUsers = clients.size;
  if (metrics.activeUsers > metrics.peakConcurrentUsers) {
    metrics.peakConcurrentUsers = metrics.activeUsers;
  }
  
  console.log(`User authenticated: ${user.username} (${clientId})`);
  
  // Notify other users that this user came online
  broadcastToAll({
    type: 'user_online',
    user: {
      id: user.userId,
      username: user.username
    },
    timestamp: new Date().toISOString()
  }, clientId, clients, metrics);
  
  ws.send(JSON.stringify({
    type: 'auth_success',
    user: {
      id: user.userId,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName
    },
    timestamp: new Date().toISOString()
  }));
}

async function handleGetOnlineUsers(ws, data, clientId, clients, userConnections) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required',
      details: 'You must be authenticated to view online users.'
    }));
    return;
  }
  
  const onlineUsers = Array.from(userConnections.keys())
    .filter(userId => userId !== client.user.userId) // Exclude self
    .map(userId => {
      const userClient = clients.get(userConnections.get(userId));
      return {
        id: userId,
        username: userClient?.user?.username || userId,
        online: true
      };
    });
  
  ws.send(JSON.stringify({
    type: 'online_users',
    users: onlineUsers,
    timestamp: new Date().toISOString()
  }));
}

async function handleStartConversation(ws, data, clientId, clients, userConnections, conversations, metrics) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required',
      details: 'You must be authenticated to start conversations.'
    }));
    return;
  }
  
  const { recipientId } = data;
  
  if (!recipientId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Recipient ID is required'
    }));
    return;
  }
  
  // Check if recipient exists and is online
  const recipientClientId = userConnections.get(recipientId);
  if (!recipientClientId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Recipient is not online'
    }));
    return;
  }
  
  const conversationId = generateConversationId(client.user.userId, recipientId);
  
  // Create or get conversation
  if (!conversations.has(conversationId)) {
    conversations.set(conversationId, {
      participants: new Set([client.user.userId, recipientId]),
      messages: []
    });
    metrics.conversations = conversations.size;
  }
  
  // Load messages from database
  const dbMessages = await loadPrivateMessagesFromDatabase(conversationId, require('../config/database').dbPool, 50);
  
  // Update in-memory conversation messages with database messages
  const conversation = conversations.get(conversationId);
  if (dbMessages.length > 0) {
    conversation.messages = dbMessages;
  }
  
  const recentMessages = conversation.messages.slice(-50);
  
  ws.send(JSON.stringify({
    type: 'conversation_started',
    conversationId: conversationId,
    recipient: {
      id: recipientId,
      username: clients.get(recipientClientId)?.user?.username || recipientId
    },
    messages: recentMessages,
    timestamp: new Date().toISOString()
  }));
  
  console.log(`Conversation started between ${client.user.username} and ${recipientId}`);
}

async function handleSendPrivateMessage(ws, data, clientId, clients, userConnections, conversations, metrics) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required',
      details: 'You must be authenticated to send messages.'
    }));
    return;
  }
  
  const { recipientId, content, conversationId, replyTo } = data;
  
  if (!content || !recipientId) {
    const missingFields = [];
    if (!content) missingFields.push('content');
    if (!recipientId) missingFields.push('recipientId');
    
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Missing required fields',
      details: `The following fields are required but missing: ${missingFields.join(', ')}`,
      field: missingFields[0] || 'general'
    }));
    return;
  }
  
  // Content moderation check
  const moderationResult = checkMessageModeration(content);
  if (!moderationResult.isAppropriate) {
    ws.send(JSON.stringify({
      type: 'moderation_warning',
      message: moderationResult.reason,
      action: moderationResult.action
    }));
    
    if (moderationResult.action === 'DELETE') {
      return; // Don't send the message
    }
  }
  
  const convId = conversationId || generateConversationId(client.user.userId, recipientId);
  
  // Create or get conversation
  if (!conversations.has(convId)) {
    conversations.set(convId, {
      participants: new Set([client.user.userId, recipientId]),
      messages: []
    });
    metrics.conversations = conversations.size;
  }
  
  // Create message
  const msgId = crypto.randomUUID();
  const message = {
    id: msgId,
    conversationId: convId,
    senderId: client.user.userId,
    recipientId: recipientId,
    username: client.user.username,
    content: content,
    timestamp: new Date().toISOString(),
    isRead: false,
    replyTo: replyTo || null
  };
  
  // Store message in conversation (in-memory for real-time)
  const conversation = conversations.get(convId);
  conversation.messages.push(message);
  if (conversation.messages.length > 1000) {
    conversation.messages = conversation.messages.slice(-500); // Keep last 500 messages
  }
  
  // Save message to database
  await savePrivateMessageToDatabase(message, require('../config/database').dbPool);
  
  metrics.messagesSent++;
  metrics.totalDataTransferred += Buffer.byteLength(JSON.stringify(message));
  
  // Send to sender (confirmation)
  ws.send(JSON.stringify({
    type: 'private_message_sent',
    message: message,
    messageId: msgId,
    conversationId: convId,
    replyTo: replyTo || null,
    timestamp: new Date().toISOString()
  }));
  
  // Send to recipient if online (with delay to avoid race conditions)
  const recipientClientId = userConnections.get(recipientId);
  if (recipientClientId) {
    const recipientClient = clients.get(recipientClientId);
    if (recipientClient && recipientClient.ws.readyState === require('ws').OPEN) {
      // Use setTimeout to avoid race conditions with mark as read
      setTimeout(() => {
        if (recipientClient.ws.readyState === require('ws').OPEN) {
          // Prepare message data with reply context if applicable
          let messageData = {
            type: 'new_private_message',
            message: message,
            timestamp: new Date().toISOString()
          };

          // If this is a reply, include the original message context
          if (replyTo) {
            // Find the original message in the conversation
            const originalMessage = conversation.messages.find(m => m.id === replyTo);
            if (originalMessage) {
              messageData.replyTo = {
                messageId: originalMessage.id,
                content: originalMessage.content,
                username: originalMessage.username,
                timestamp: originalMessage.timestamp
              };
            }
          }

          recipientClient.ws.send(JSON.stringify(messageData));
        }
      }, 100);
    }
  }
  
  console.log(`Private message sent from ${client.user.username} to ${recipientId}`);
}

async function handleMarkMessageRead(ws, data, clientId, clients, userConnections, conversations) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required',
      details: 'You must be authenticated to mark messages as read.'
    }));
    return;
  }
  
  const { messageId, conversationId } = data;
  
  if (!messageId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Missing required fields',
      details: 'Message ID is required to mark a message as read.',
      field: 'messageId'
    }));
    return;
  }
  
  // If conversationId is not provided, try to find it from the message
  let actualConversationId = conversationId;
  let foundMessage = null;
  
  if (!actualConversationId) {
    // Try to find the conversation by searching through all conversations
    for (const [convId, conversation] of conversations.entries()) {
      const message = conversation.messages.find(m => m.id === messageId);
      if (message) {
        actualConversationId = convId;
        foundMessage = message;
        break;
      }
    }
  } else {
    // If conversationId is provided, find the message in that conversation
    const conversation = conversations.get(actualConversationId);
    if (conversation) {
      foundMessage = conversation.messages.find(m => m.id === messageId);
    }
  }
  
  if (!actualConversationId || !foundMessage) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Message not found',
      details: 'Could not find the message or its conversation.',
      field: 'messageId'
    }));
    return;
  }
  
  // Verify the user is the recipient of this message
  if (foundMessage.recipientId !== client.user.userId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Permission denied',
      details: 'You can only mark messages sent to you as read.',
      field: 'messageId'
    }));
    return;
  }
  
  // Mark message as read in database
  const { dbPool } = require('../config/database');
  if (dbPool) {
    try {
      await dbPool.query(`
        UPDATE private_messages 
        SET is_read = true 
        WHERE message_id = $1 AND recipient_id = $2
      `, [messageId, client.user.userId]);
      
      console.log(`Message ${messageId} marked as read by ${client.user.username}`);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }
  
  // Mark message as read in memory
  foundMessage.isRead = true;
  
  // Send confirmation to the user who marked the message as read
  ws.send(JSON.stringify({
    type: 'message_marked_read',
    messageId: messageId,
    conversationId: actualConversationId,
    timestamp: new Date().toISOString()
  }));
  
  // Notify sender that message was read
  const conversation = conversations.get(actualConversationId);
  if (conversation) {
    const message = conversation.messages.find(m => m.id === messageId);
    if (message && message.senderId !== client.user.userId) {
      const senderClientId = userConnections.get(message.senderId);
      if (senderClientId) {
        const senderClient = clients.get(senderClientId);
        if (senderClient && senderClient.ws.readyState === require('ws').OPEN) {
          senderClient.ws.send(JSON.stringify({
            type: 'message_read',
            messageId: messageId,
            readBy: client.user.userId,
            timestamp: new Date().toISOString()
          }));
        }
      }
    }
  }
}

async function handleTyping(ws, data, clientId, clients, userConnections) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required',
      details: 'You must be authenticated to send typing indicators.'
    }));
    return;
  }
  
  const { recipientId, isTyping } = data;
  
  // Validate typing indicator data
  if (!recipientId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Missing recipient ID',
      details: 'Recipient ID is required for typing indicators.'
    }));
    return;
  }
  
  if (typeof isTyping !== 'boolean') {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Invalid typing state',
      details: 'isTyping must be a boolean value (true/false).'
    }));
    return;
  }
  
  // Send typing indicator to recipient
  const recipientClientId = userConnections.get(recipientId);
  if (recipientClientId) {
    const recipientClient = clients.get(recipientClientId);
    if (recipientClient && recipientClient.ws.readyState === require('ws').OPEN) {
      recipientClient.ws.send(JSON.stringify({
        type: 'typing_indicator',
        senderId: client.user.userId,
        senderUsername: client.user.username,
        isTyping: isTyping,
        timestamp: new Date().toISOString()
      }));
    }
  }
  
  // Send confirmation to sender
  ws.send(JSON.stringify({
    type: 'typing_indicator_sent',
    recipientId: recipientId,
    isTyping: isTyping,
    timestamp: new Date().toISOString()
  }));
}

async function handleAddReaction(ws, data, clientId, clients, userConnections, conversations) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required',
      details: 'You must be authenticated to add reactions.'
    }));
    return;
  }
  
  const { messageId, reaction, conversationId } = data;
  
  if (!messageId || !reaction) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Missing required fields',
      details: 'Message ID and reaction are required.'
    }));
    return;
  }
  
  // Validate reaction (emoji or short text)
  if (reaction.length > 10) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Invalid reaction',
      details: 'Reaction must be 10 characters or less.'
    }));
    return;
  }
  
  // Find the message - search across all conversations if not found in specified one
  let actualConversationId = conversationId;
  let message = null;
  
  // First try the specified conversation if provided
  if (actualConversationId) {
    const conversation = conversations.get(actualConversationId);
    if (conversation) {
      message = conversation.messages.find(m => m.id === messageId);
    }
  }
  
  // If not found in specified conversation, search all conversations
  if (!message) {
    for (const [convId, conversation] of conversations.entries()) {
      message = conversation.messages.find(m => m.id === messageId);
      if (message) {
        actualConversationId = convId;
        break;
      }
    }
  }
  
  if (!message) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Message not found',
      details: 'Could not find the message to react to.'
    }));
    return;
  }
  
  // Initialize reactions if not exists
  if (!message.reactions) {
    message.reactions = [];
  }
  
  // Check if user already reacted with this emoji
  const existingReaction = message.reactions.find(r => 
    r.userId === client.user.userId && r.reaction === reaction
  );
  
  if (existingReaction) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Reaction already exists',
      details: 'You have already reacted with this emoji.'
    }));
    return;
  }
  
  // Add reaction
  const newReaction = {
    userId: client.user.userId,
    username: client.user.username,
    reaction: reaction,
    timestamp: new Date().toISOString()
  };
  
  message.reactions.push(newReaction);
  
  // Send confirmation to sender
  ws.send(JSON.stringify({
    type: 'reaction_added',
    messageId: messageId,
    conversationId: actualConversationId,
    reaction: newReaction,
    timestamp: new Date().toISOString()
  }));
  
  // Notify message sender about the reaction
  if (message.senderId !== client.user.userId) {
    const senderClientId = userConnections.get(message.senderId);
    if (senderClientId) {
      const senderClient = clients.get(senderClientId);
      if (senderClient && senderClient.ws.readyState === require('ws').OPEN) {
        senderClient.ws.send(JSON.stringify({
          type: 'reaction_added',
          messageId: messageId,
          conversationId: actualConversationId,
          reaction: newReaction,
          timestamp: new Date().toISOString()
        }));
      }
    }
  }
}

async function handleRemoveReaction(ws, data, clientId, clients, userConnections, conversations) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required',
      details: 'You must be authenticated to remove reactions.'
    }));
    return;
  }
  
  const { messageId, reaction, conversationId } = data;
  
  if (!messageId || !reaction) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Missing required fields',
      details: 'Message ID and reaction are required.'
    }));
    return;
  }
  
  // Find the message - search across all conversations if not found in specified one
  let actualConversationId = conversationId;
  let message = null;
  
  // First try the specified conversation if provided
  if (actualConversationId) {
    const conversation = conversations.get(actualConversationId);
    if (conversation) {
      message = conversation.messages.find(m => m.id === messageId);
    }
  }
  
  // If not found in specified conversation, search all conversations
  if (!message) {
    for (const [convId, conversation] of conversations.entries()) {
      message = conversation.messages.find(m => m.id === messageId);
      if (message) {
        actualConversationId = convId;
        break;
      }
    }
  }
  
  if (!message || !message.reactions) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Reaction not found',
      details: 'Could not find the reaction to remove.'
    }));
    return;
  }
  
  // Find and remove the reaction
  const reactionIndex = message.reactions.findIndex(r => 
    r.userId === client.user.userId && r.reaction === reaction
  );
  
  if (reactionIndex === -1) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Reaction not found',
      details: 'You have not reacted with this emoji.'
    }));
    return;
  }
  
  const removedReaction = message.reactions.splice(reactionIndex, 1)[0];
  
  // Send confirmation to sender
  ws.send(JSON.stringify({
    type: 'reaction_removed',
    messageId: messageId,
    conversationId: actualConversationId,
    reaction: removedReaction,
    timestamp: new Date().toISOString()
  }));
  
  // Notify message sender about the reaction removal
  if (message.senderId !== client.user.userId) {
    const senderClientId = userConnections.get(message.senderId);
    if (senderClientId) {
      const senderClient = clients.get(senderClientId);
      if (senderClient && senderClient.ws.readyState === require('ws').OPEN) {
        senderClient.ws.send(JSON.stringify({
          type: 'reaction_removed',
          messageId: messageId,
          conversationId: actualConversationId,
          reaction: removedReaction,
          timestamp: new Date().toISOString()
        }));
      }
    }
  }
}

function broadcastToAll(message, excludeClientId = null, clients, metrics) {
  const messageStr = JSON.stringify(message);
  const messageSize = Buffer.byteLength(messageStr);
  
  clients.forEach((client, clientId) => {
    if (clientId === excludeClientId) return;
    
    if (client.ws.readyState === require('ws').OPEN) {
      try {
        client.ws.send(messageStr);
        metrics.totalDataTransferred += messageSize;
      } catch (error) {
        console.error('Error broadcasting to client:', error);
      }
    }
  });
}

async function handleEditMessage(ws, data, clientId, clients, userConnections, conversations) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required',
      details: 'You must be authenticated to edit messages.'
    }));
    return;
  }
  
  const { messageId, newContent, conversationId } = data;
  
  if (!messageId || !newContent) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Missing required fields',
      details: 'Message ID and new content are required.'
    }));
    return;
  }
  
  // Find the message - search across all conversations if not found in specified one
  let actualConversationId = conversationId;
  let message = null;
  
  // First try the specified conversation if provided
  if (actualConversationId) {
    const conversation = conversations.get(actualConversationId);
    if (conversation) {
      message = conversation.messages.find(m => m.id === messageId);
    }
  }
  
  // If not found in specified conversation, search all conversations
  if (!message) {
    for (const [convId, conversation] of conversations.entries()) {
      message = conversation.messages.find(m => m.id === messageId);
      if (message) {
        actualConversationId = convId;
        break;
      }
    }
  }
  
  if (!message) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Message not found',
      details: 'Could not find the message to edit.'
    }));
    return;
  }
  
  // Check if user is the sender of the message
  if (message.senderId !== client.user.userId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Permission denied',
      details: 'You can only edit your own messages.'
    }));
    return;
  }
  
  // Check if message is too old (5 minutes limit)
  const messageTime = new Date(message.timestamp);
  const now = new Date();
  const timeDiff = now - messageTime;
  const fiveMinutes = 5 * 60 * 1000;
  
  if (timeDiff > fiveMinutes) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Edit time limit exceeded',
      details: 'Messages can only be edited within 5 minutes of sending.'
    }));
    return;
  }
  
  // Update message content
  const oldContent = message.content;
  message.content = newContent;
  message.edited = true;
  message.editedAt = new Date().toISOString();
  
  // Update in database
  const { dbPool } = require('../config/database');
  if (dbPool) {
    try {
      await dbPool.query(`
        UPDATE private_messages 
        SET content = $1, edited = true, edited_at = $2 
        WHERE message_id = $3
      `, [newContent, message.editedAt, messageId]);
      
      console.log(`Message ${messageId} edited by ${client.user.username}`);
    } catch (error) {
      console.error('Error editing message in database:', error);
    }
  }
  
  // Send confirmation to sender
  ws.send(JSON.stringify({
    type: 'message_edited',
    messageId: messageId,
    conversationId: actualConversationId,
    newContent: newContent,
    oldContent: oldContent,
    timestamp: new Date().toISOString()
  }));
  
  // Notify other participants in the conversation
  const conversation = conversations.get(actualConversationId);
  if (conversation) {
    for (const participantId of conversation.participants) {
      if (participantId !== client.user.userId) {
        const participantClientId = userConnections.get(participantId);
        if (participantClientId) {
          const participantClient = clients.get(participantClientId);
          if (participantClient && participantClient.ws.readyState === require('ws').OPEN) {
            participantClient.ws.send(JSON.stringify({
              type: 'message_edited',
              messageId: messageId,
              conversationId: actualConversationId,
              newContent: newContent,
              oldContent: oldContent,
              timestamp: new Date().toISOString()
            }));
          }
        }
      }
    }
  }
}

async function handleDeleteMessage(ws, data, clientId, clients, userConnections, conversations) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required',
      details: 'You must be authenticated to delete messages.'
    }));
    return;
  }
  
  const { messageId, conversationId, deleteForEveryone = false } = data;
  
  if (!messageId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Missing required fields',
      details: 'Message ID is required.'
    }));
    return;
  }
  
  // Find the message - search across all conversations if not found in specified one
  let actualConversationId = conversationId;
  let message = null;
  
  // First try the specified conversation if provided
  if (actualConversationId) {
    const conversation = conversations.get(actualConversationId);
    if (conversation) {
      message = conversation.messages.find(m => m.id === messageId);
    }
  }
  
  // If not found in specified conversation, search all conversations
  if (!message) {
    for (const [convId, conversation] of conversations.entries()) {
      message = conversation.messages.find(m => m.id === messageId);
      if (message) {
        actualConversationId = convId;
        break;
      }
    }
  }
  
  if (!message) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Message not found',
      details: 'Could not find the message to delete.'
    }));
    return;
  }
  
  // Check permissions
  if (deleteForEveryone && message.senderId !== client.user.userId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Permission denied',
      details: 'You can only delete your own messages for everyone.'
    }));
    return;
  }
  
  // Update in database
  const { dbPool } = require('../config/database');
  if (dbPool) {
    try {
      if (deleteForEveryone) {
        // Delete for everyone
        await dbPool.query(`
          UPDATE private_messages 
          SET deleted = true, deleted_at = $1, deleted_for_everyone = true 
          WHERE message_id = $2
        `, [new Date().toISOString(), messageId]);
      } else {
        // Delete for user only
        await dbPool.query(`
          INSERT INTO message_deletions (message_id, user_id, deleted_at) 
          VALUES ($1, $2, $3) 
          ON CONFLICT (message_id, user_id) DO UPDATE SET deleted_at = $3
        `, [messageId, client.user.userId, new Date().toISOString()]);
      }
      
      console.log(`Message ${messageId} ${deleteForEveryone ? 'deleted for everyone' : 'deleted for user'} by ${client.user.username}`);
    } catch (error) {
      console.error('Error deleting message in database:', error);
    }
  }
  
  // Send confirmation to sender
  ws.send(JSON.stringify({
    type: 'message_deleted',
    messageId: messageId,
    conversationId: actualConversationId,
    deleteForEveryone: deleteForEveryone,
    timestamp: new Date().toISOString()
  }));
  
  // Notify other participants if deleted for everyone
  if (deleteForEveryone) {
    const conversation = conversations.get(actualConversationId);
    if (conversation) {
      for (const participantId of conversation.participants) {
        if (participantId !== client.user.userId) {
          const participantClientId = userConnections.get(participantId);
          if (participantClientId) {
            const participantClient = clients.get(participantClientId);
            if (participantClient && participantClient.ws.readyState === require('ws').OPEN) {
              participantClient.ws.send(JSON.stringify({
                type: 'message_deleted',
                messageId: messageId,
                conversationId: actualConversationId,
                deleteForEveryone: true,
                timestamp: new Date().toISOString()
              }));
            }
          }
        }
      }
    }
  }
}

async function handleDeleteConversation(ws, data, clientId, clients, userConnections, conversations) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required',
      details: 'You must be authenticated to delete conversations.'
    }));
    return;
  }
  
  const { conversationId, deleteForEveryone = false } = data;
  
  if (!conversationId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Missing required fields',
      details: 'Conversation ID is required.'
    }));
    return;
  }
  
  // Find the conversation
  const conversation = conversations.get(conversationId);
  if (!conversation) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Conversation not found',
      details: 'Could not find the conversation to delete.'
    }));
    return;
  }
  
  // Check if user is a participant in this conversation
  if (!conversation.participants.has(client.user.userId)) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Permission denied',
      details: 'You can only delete conversations you are part of.'
    }));
    return;
  }
  
  // Update in database
  const { dbPool } = require('../config/database');
  if (dbPool) {
    try {
      if (deleteForEveryone) {
        // Delete conversation for everyone - mark all messages as deleted
        await dbPool.query(`
          UPDATE private_messages 
          SET deleted = true, deleted_at = $1, deleted_for_everyone = true 
          WHERE conversation_id = $2
        `, [new Date().toISOString(), conversationId]);
        
        // Also mark the conversation as deleted
        await dbPool.query(`
          UPDATE conversations 
          SET deleted = true, deleted_at = $1, deleted_for_everyone = true 
          WHERE conversation_id = $2
        `, [new Date().toISOString(), conversationId]);
        
        console.log(`Conversation ${conversationId} deleted for everyone by ${client.user.username}`);
      } else {
        // Delete conversation for user only
        await dbPool.query(`
          INSERT INTO conversation_deletions (conversation_id, user_id, deleted_at) 
          VALUES ($1, $2, $3) 
          ON CONFLICT (conversation_id, user_id) DO UPDATE SET deleted_at = $3
        `, [conversationId, client.user.userId, new Date().toISOString()]);
        
        console.log(`Conversation ${conversationId} deleted for user ${client.user.username}`);
      }
    } catch (error) {
      console.error('Error deleting conversation in database:', error);
    }
  }
  
  // Send confirmation to the user who deleted the conversation
  ws.send(JSON.stringify({
    type: 'conversation_deleted',
    conversationId: conversationId,
    deleteForEveryone: deleteForEveryone,
    timestamp: new Date().toISOString()
  }));
  
  // Notify other participants if deleted for everyone
  if (deleteForEveryone) {
    for (const participantId of conversation.participants) {
      if (participantId !== client.user.userId) {
        const participantClientId = userConnections.get(participantId);
        if (participantClientId) {
          const participantClient = clients.get(participantClientId);
          if (participantClient && participantClient.ws.readyState === require('ws').OPEN) {
            participantClient.ws.send(JSON.stringify({
              type: 'conversation_deleted',
              conversationId: conversationId,
              deleteForEveryone: true,
              timestamp: new Date().toISOString()
            }));
          }
        }
      }
    }
    
    // Remove conversation from memory if deleted for everyone
    conversations.delete(conversationId);
  }
}

module.exports = {
  generateConversationId,
  handleAuthentication,
  handleGetOnlineUsers,
  handleStartConversation,
  handleSendPrivateMessage,
  handleMarkMessageRead,
  handleTyping,
  handleAddReaction,
  handleRemoveReaction,
  handleEditMessage,
  handleDeleteMessage,
  handleDeleteConversation,
  broadcastToAll
};
