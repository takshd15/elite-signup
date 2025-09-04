const { encryptMessage, decryptMessage } = require('../security/encryption');
const { getRedisClient, isRedisConnected } = require('../config/redis');

// Save private message to database with encryption
async function savePrivateMessageToDatabase(message, dbPool) {
  try {
    // Encrypt the message content
    const encryptionResult = encryptMessage(message.content);
    
    if (encryptionResult) {
      await dbPool.query(`
        INSERT INTO private_messages (message_id, conversation_id, sender_id, recipient_id, content, encrypted_content, encryption_iv, is_encrypted, is_read, reply_to)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        message.id, 
        message.conversationId, 
        message.senderId, 
        message.recipientId, 
        message.content, // Keep original for fallback
        encryptionResult.encrypted,
        encryptionResult.iv,
        true, // is_encrypted
        false, // is_read
        message.replyTo || null // reply_to field
      ]);
      
      console.log(`Encrypted private message saved to database: ${message.id}`);
      
      // Cache message in Redis
      if (isRedisConnected()) {
        try {
          const redisClient = getRedisClient();
          await redisClient.setEx(`message:${message.id}`, 3600, JSON.stringify(message));
          await redisClient.lPush(`conversation:${message.conversationId}`, JSON.stringify(message));
          await redisClient.lTrim(`conversation:${message.conversationId}`, 0, 99); // Keep last 100 messages
        } catch (redisError) {
          console.warn('Redis caching failed:', redisError.message);
        }
      }
    } else {
      // Fallback to unencrypted if encryption fails
      await dbPool.query(`
        INSERT INTO private_messages (message_id, conversation_id, sender_id, recipient_id, content, is_encrypted, is_read, reply_to)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [message.id, message.conversationId, message.senderId, message.recipientId, message.content, false, false, message.replyTo || null]);
      
      console.warn(`Unencrypted private message saved to database (encryption failed): ${message.id}`);
      
      // Cache message in Redis (even if unencrypted)
      if (isRedisConnected()) {
        try {
          const redisClient = getRedisClient();
          await redisClient.setEx(`message:${message.id}`, 3600, JSON.stringify(message));
          await redisClient.lPush(`conversation:${message.conversationId}`, JSON.stringify(message));
          await redisClient.lTrim(`conversation:${message.conversationId}`, 0, 99);
        } catch (redisError) {
          console.warn('Redis caching failed:', redisError.message);
        }
      }
    }
  } catch (error) {
    console.error('Error saving private message to database:', error);
  }
}

// Load private messages from database with decryption
async function loadPrivateMessagesFromDatabase(conversationId, dbPool, limit = 50) {
  try {
    // Try to get messages from Redis cache first
    if (isRedisConnected()) {
      try {
        const redisClient = getRedisClient();
        const cachedMessages = await redisClient.lRange(`conversation:${conversationId}`, 0, limit - 1);
        
        if (cachedMessages && cachedMessages.length > 0) {
          console.log(`Loaded ${cachedMessages.length} messages from Redis cache for conversation ${conversationId}`);
          return cachedMessages.map(msg => JSON.parse(msg));
        }
      } catch (redisError) {
        console.warn('Redis cache read failed, falling back to database:', redisError.message);
      }
    }
    
    // Fallback to database if Redis cache miss
    const result = await dbPool.query(`
      SELECT 
        pm.message_id as id, 
        pm.conversation_id as "conversationId", 
        pm.sender_id as "senderId", 
        pm.recipient_id as "recipientId", 
        COALESCE(ua.username, cu.username, pm.sender_id) as username,
        pm.content,
        pm.encrypted_content,
        pm.encryption_iv,
        pm.is_encrypted,
        pm.is_read as "isRead",
        pm.reply_to as "replyTo",
        pm.created_at as "timestamp"
      FROM private_messages pm
      LEFT JOIN users_auth ua ON pm.sender_id = ua.user_id::VARCHAR
      LEFT JOIN chat_users cu ON pm.sender_id = cu.user_id
      WHERE pm.conversation_id = $1 
      ORDER BY pm.created_at DESC 
      LIMIT $2
    `, [conversationId, limit]);
    
    // Convert to message format and reverse to get chronological order
    const messages = result.rows.reverse().map(row => {
      let content = row.content;
      
      // Decrypt if message is encrypted
      if (row.is_encrypted && row.encrypted_content && row.encryption_iv) {
        const decrypted = decryptMessage(row.encrypted_content, row.encryption_iv);
        if (decrypted) {
          content = decrypted;
        } else {
          console.warn(`Failed to decrypt message ${row.id}, using fallback content`);
        }
      }
      
      return {
        id: row.id,
        conversationId: row.conversationId,
        senderId: row.senderId,
        recipientId: row.recipientId,
        username: row.username,
        content: content,
        timestamp: row.timestamp,
        isRead: row.isRead || false,
        replyTo: row.replyTo || null
      };
    });
    
    console.log(`Loaded ${messages.length} private messages from database for conversation: ${conversationId}`);
    return messages;
  } catch (error) {
    console.error('Error loading private messages from database:', error);
    return [];
  }
}

// Edit a message in the database
async function editMessageInDatabase(messageId, newContent, dbPool) {
  try {
    const result = await dbPool.query(`
      UPDATE private_messages 
      SET content = $1, is_edited = true, edited_at = $2, updated_at = $2
      WHERE message_id = $3 AND is_deleted = false
      RETURNING *
    `, [newContent, new Date().toISOString(), messageId]);
    
    if (result.rows.length > 0) {
      console.log(`Message ${messageId} edited successfully`);
      
      // Update Redis cache
      if (isRedisConnected()) {
        try {
          const redisClient = getRedisClient();
          const message = result.rows[0];
          await redisClient.setEx(`message:${messageId}`, 3600, JSON.stringify(message));
        } catch (redisError) {
          console.warn('Redis cache update failed for edited message:', redisError.message);
        }
      }
      
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error('Error editing message in database:', error);
    throw error;
  }
}

// Delete a message for everyone
async function deleteMessageForEveryone(messageId, dbPool) {
  try {
    const result = await dbPool.query(`
      UPDATE private_messages 
      SET is_deleted = true, deleted_at = $1, deleted_for_everyone = true, updated_at = $1
      WHERE message_id = $2
      RETURNING *
    `, [new Date().toISOString(), messageId]);
    
    if (result.rows.length > 0) {
      console.log(`Message ${messageId} deleted for everyone`);
      
      // Remove from Redis cache
      if (isRedisConnected()) {
        try {
          const redisClient = getRedisClient();
          await redisClient.del(`message:${messageId}`);
        } catch (redisError) {
          console.warn('Redis cache deletion failed:', redisError.message);
        }
      }
      
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error('Error deleting message for everyone:', error);
    throw error;
  }
}

// Delete a message for a specific user only
async function deleteMessageForUser(messageId, userId, dbPool) {
  try {
    // Insert into message_deletions table
    await dbPool.query(`
      INSERT INTO message_deletions (message_id, user_id, deleted_at) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (message_id, user_id) DO UPDATE SET deleted_at = $3
    `, [messageId, userId, new Date().toISOString()]);
    
    console.log(`Message ${messageId} deleted for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error deleting message for user:', error);
    throw error;
  }
}

// Delete an entire conversation for everyone
async function deleteConversationForEveryone(conversationId, dbPool) {
  try {
    // Mark all messages in conversation as deleted
    await dbPool.query(`
      UPDATE private_messages 
      SET is_deleted = true, deleted_at = $1, deleted_for_everyone = true, updated_at = $1
      WHERE conversation_id = $2
    `, [new Date().toISOString(), conversationId]);
    
    // Mark conversation as deleted
    await dbPool.query(`
      UPDATE conversations 
      SET deleted = true, deleted_at = $1, deleted_for_everyone = true, updated_at = $1
      WHERE conversation_id = $2
    `, [new Date().toISOString(), conversationId]);
    
    console.log(`Conversation ${conversationId} deleted for everyone`);
    return true;
  } catch (error) {
    console.error('Error deleting conversation for everyone:', error);
    throw error;
  }
}

// Delete a conversation for a specific user only
async function deleteConversationForUser(conversationId, userId, dbPool) {
  try {
    // Insert into conversation_deletions table
    await dbPool.query(`
      INSERT INTO conversation_deletions (conversation_id, user_id, deleted_at) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (conversation_id, user_id) DO UPDATE SET deleted_at = $3
    `, [conversationId, userId, new Date().toISOString()]);
    
    console.log(`Conversation ${conversationId} deleted for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error deleting conversation for user:', error);
    throw error;
  }
}

// Get messages with deletion status for a user
async function getMessagesWithDeletionStatus(conversationId, userId, dbPool) {
  try {
    const result = await dbPool.query(`
      SELECT 
        pm.*,
        CASE 
          WHEN pm.deleted_for_everyone = true THEN true
          WHEN md.message_id IS NOT NULL THEN true
          ELSE false
        END as is_deleted_for_user
      FROM private_messages pm
      LEFT JOIN message_deletions md ON pm.message_id = md.message_id AND md.user_id = $2
      WHERE pm.conversation_id = $1 
        AND pm.is_deleted = false
        AND (pm.deleted_for_everyone = false OR md.message_id IS NULL)
      ORDER BY pm.created_at ASC
    `, [conversationId, userId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting messages with deletion status:', error);
    throw error;
  }
}

module.exports = {
  savePrivateMessageToDatabase,
  loadPrivateMessagesFromDatabase,
  editMessageInDatabase,
  deleteMessageForEveryone,
  deleteMessageForUser,
  deleteConversationForEveryone,
  deleteConversationForUser,
  getMessagesWithDeletionStatus
};

