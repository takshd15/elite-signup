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

module.exports = {
  savePrivateMessageToDatabase,
  loadPrivateMessagesFromDatabase
};

