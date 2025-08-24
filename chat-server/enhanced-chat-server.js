const WebSocket = require('ws');
const http = require('http');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const winston = require('winston');
const { Client } = require('pg');

// Database connection
const dbClient = new Client({
  host: process.env.DB_HOST || 'cd6emofiekhlj.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'd4ukv7mqkkc9i1',
  user: process.env.DB_USER || 'u2eb6vlhflq6bt',
  password: process.env.DB_PASS || 'pe9512a0cbf2bc2eee176022c82836beedc48733196d06484e5dc69e2754f5a79',
  ssl: {
    rejectUnauthorized: false
  }
});

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Security configuration
const JWT_SECRET = '12341234123412341234123412341234123412341234';
const CHAT_ENCRYPTION_KEY = 'super-secure-aes-encryption-key-32';

// Performance settings
const MAX_CONNECTIONS_PER_IP = 10;
const MESSAGE_RATE_LIMIT = 30;
const CONNECTION_TIMEOUT = 30000;
const TYPING_TIMEOUT = 5000; // 5 seconds typing indicator
const USER_STATUS_TIMEOUT = 30000; // 30 seconds for offline status

// Create HTTP server
const server = http.createServer({
  maxHeaderSize: 8192,
  keepAlive: true,
  keepAliveTimeout: 60000,
  maxConnections: 10000
});

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  clientTracking: true,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024
  },
  maxPayload: 1024 * 1024
});

// Enhanced data structures
const clients = new Map();
const channels = new Map();
const ipConnections = new Map();
const messageRateLimit = new Map();
const sessions = new Map();
const typingUsers = new Map(); // Track typing users per channel
const userStatus = new Map(); // Track user online/offline status
const lastSeen = new Map(); // Track last seen timestamps

// Connect to database
let dbConnected = false;
dbClient.connect().then(async () => {
  dbConnected = true;
  logger.info('Database connected successfully');
  
  try {
    const fs = require('fs');
    const path = require('path');
    const sqlFile = fs.readFileSync(path.join(__dirname, 'chat_tables_simple.sql'), 'utf8');
    
    const statements = sqlFile.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await dbClient.query(statement);
      }
    }
    
    logger.info('Chat tables created/updated successfully');
  } catch (error) {
    logger.error('Error creating chat tables:', error);
  }
}).catch(err => {
  logger.warn('Database connection failed, using fallback mode:', err.message);
  dbConnected = false;
});

// Initialize default channels
async function initializeDefaultChannels() {
  if (dbConnected) {
    try {
      const result = await dbClient.query(`
        SELECT channel_id as id, name, description
        FROM chat_channels
        ORDER BY created_at
      `);
      
      result.rows.forEach(channelData => {
        channels.set(channelData.id, {
          id: channelData.id,
          name: channelData.name,
          description: channelData.description,
          clients: new Set(),
          messages: [],
          typing: new Set()
        });
      });
      
      logger.info(`Loaded ${channels.size} channels from database`);
    } catch (error) {
      logger.error('Error loading channels from database:', error);
      initializeFallbackChannels();
    }
  } else {
    initializeFallbackChannels();
  }
}

function initializeFallbackChannels() {
  const defaultChannels = [
    { id: 'general', name: 'General', description: 'General discussion' },
    { id: 'feedback', name: 'Feedback', description: 'Share your feedback and suggestions' },
    { id: 'career', name: 'Career', description: 'Career advice and job discussions' },
    { id: 'learning', name: 'Learning', description: 'Share educational resources and tips' },
    { id: 'networking', name: 'Networking', description: 'Professional networking opportunities' }
  ];

  defaultChannels.forEach(channelData => {
    channels.set(channelData.id, {
      id: channelData.id,
      name: channelData.name,
      description: channelData.description,
      clients: new Set(),
      messages: [],
      typing: new Set()
    });
  });
}

// Enhanced user management functions
async function getUserDetails(userId) {
  if (!dbConnected) {
    return { id: userId, username: `user${userId}`, displayName: `User ${userId}` };
  }

  try {
    const result = await dbClient.query(`
      SELECT ua.user_id, ua.username, ua.email, upi.first_name, upi.last_name
      FROM users_auth ua
      LEFT JOIN user_profile_info upi ON ua.user_id = upi.user_id_serial
      WHERE ua.user_id = $1
    `, [userId]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      return {
        id: user.user_id,
        username: user.username,
        email: user.email,
        displayName: user.first_name && user.last_name ? 
          `${user.first_name} ${user.last_name}` : user.username
      };
    }
    return { id: userId, username: `user${userId}`, displayName: `User ${userId}` };
  } catch (error) {
    logger.error('Error getting user details:', error);
    return { id: userId, username: `user${userId}`, displayName: `User ${userId}` };
  }
}

// User status management
function updateUserStatus(userId, status) {
  const now = Date.now();
  userStatus.set(userId, { status, timestamp: now });
  lastSeen.set(userId, now);
  
  // Broadcast status update to all channels user is in
  const userChannels = new Set();
  clients.forEach(client => {
    if (client.userId === userId && client.currentChannel) {
      userChannels.add(client.currentChannel);
    }
  });
  
  userChannels.forEach(channelId => {
    const channel = channels.get(channelId);
    if (channel) {
      broadcastToChannel(channelId, {
        type: 'user_status_update',
        userId: userId,
        status: status,
        timestamp: now
      });
    }
  });
}

// Typing indicator management
function handleTypingIndicator(userId, channelId, isTyping) {
  const channel = channels.get(channelId);
  if (!channel) return;

  if (isTyping) {
    channel.typing.add(userId);
    // Set timeout to remove typing indicator
    setTimeout(() => {
      if (channel.typing.has(userId)) {
        channel.typing.delete(userId);
        broadcastToChannel(channelId, {
          type: 'typing_stopped',
          userId: userId
        });
      }
    }, TYPING_TIMEOUT);
  } else {
    channel.typing.delete(userId);
  }

  broadcastToChannel(channelId, {
    type: isTyping ? 'typing_started' : 'typing_stopped',
    userId: userId
  });
}

// Enhanced message management functions
async function saveMessageToDatabase(messageData) {
  if (!dbConnected) return;

  try {
    const result = await dbClient.query(`
      INSERT INTO chat_messages (message_id, channel_id, user_id, content, thread_id, reply_to)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at
    `, [
      messageData.id,
      messageData.channelId,
      messageData.userId,
      messageData.content,
      messageData.threadId || null,
      messageData.replyTo || null
    ]);

    return result.rows[0];
  } catch (error) {
    logger.error('Error saving message to database:', error);
    return null;
  }
}

async function updateMessageInDatabase(messageId, newContent, userId) {
  if (!dbConnected) return false;

  try {
    const result = await dbClient.query(`
      UPDATE chat_messages 
      SET content = $1, is_edited = true, edited_at = NOW()
      WHERE message_id = $2 AND user_id = $3
      RETURNING id
    `, [newContent, messageId, userId]);

    return result.rows.length > 0;
  } catch (error) {
    logger.error('Error updating message in database:', error);
    return false;
  }
}

async function deleteMessageFromDatabase(messageId, userId) {
  if (!dbConnected) return false;

  try {
    const result = await dbClient.query(`
      DELETE FROM chat_messages 
      WHERE message_id = $1 AND user_id = $2
      RETURNING id
    `, [messageId, userId]);

    return result.rows.length > 0;
  } catch (error) {
    logger.error('Error deleting message from database:', error);
    return false;
  }
}

async function searchMessages(query, channelId, limit = 20) {
  if (!dbConnected) return [];

  try {
    const result = await dbClient.query(`
      SELECT cm.message_id, cm.content, cm.created_at, cm.is_edited,
             ua.username, upi.first_name, upi.last_name
      FROM chat_messages cm
      JOIN users_auth ua ON cm.user_id = ua.user_id
      LEFT JOIN user_profile_info upi ON ua.user_id = upi.user_id_serial
      WHERE cm.channel_id = $1 
      AND cm.content ILIKE $2
      ORDER BY cm.created_at DESC
      LIMIT $3
    `, [channelId, `%${query}%`, limit]);

    return result.rows.map(row => ({
      id: row.message_id,
      content: row.content,
      timestamp: row.created_at,
      isEdited: row.is_edited,
      user: {
        username: row.username,
        displayName: row.first_name && row.last_name ? 
          `${row.first_name} ${row.last_name}` : row.username
      }
    }));
  } catch (error) {
    logger.error('Error searching messages:', error);
    return [];
  }
}

// Message handlers
async function handleSendMessage(ws, data) {
  const client = clients.get(ws);
  if (!client || !client.authenticated) return;

  const { channelId, content, replyTo } = data;
  const channel = channels.get(channelId);
  if (!channel) return;

  const messageId = crypto.randomUUID();
  const messageData = {
    id: messageId,
    channelId,
    userId: client.userId,
    content,
    replyTo,
    timestamp: new Date().toISOString()
  };

  // Save to database
  await saveMessageToDatabase(messageData);

  // Add to channel messages
  const message = {
    ...messageData,
    user: client.userDetails
  };

  channel.messages.push(message);
  if (channel.messages.length > 100) {
    channel.messages.shift(); // Keep only last 100 messages
  }

  // Broadcast to channel
  broadcastToChannel(channelId, {
    type: 'new_message',
    message: message
  });

  // Remove typing indicator
  handleTypingIndicator(client.userId, channelId, false);
}

async function handleEditMessage(ws, data) {
  const client = clients.get(ws);
  if (!client || !client.authenticated) return;

  const { messageId, newContent, channelId } = data;
  const channel = channels.get(channelId);
  if (!channel) return;

  // Find message in channel
  const messageIndex = channel.messages.findIndex(m => m.id === messageId);
  if (messageIndex === -1) return;

  const message = channel.messages[messageIndex];
  if (message.user.id !== client.userId) return; // Only edit own messages

  // Update in database
  const success = await updateMessageInDatabase(messageId, newContent, client.userId);
  if (!success) return;

  // Update in memory
  message.content = newContent;
  message.isEdited = true;
  message.editedAt = new Date().toISOString();

  // Broadcast update
  broadcastToChannel(channelId, {
    type: 'message_edited',
    messageId: messageId,
    newContent: newContent,
    editedAt: message.editedAt
  });
}

async function handleDeleteMessage(ws, data) {
  const client = clients.get(ws);
  if (!client || !client.authenticated) return;

  const { messageId, channelId } = data;
  const channel = channels.get(channelId);
  if (!channel) return;

  // Find message in channel
  const messageIndex = channel.messages.findIndex(m => m.id === messageId);
  if (messageIndex === -1) return;

  const message = channel.messages[messageIndex];
  if (message.user.id !== client.userId) return; // Only delete own messages

  // Delete from database
  const success = await deleteMessageFromDatabase(messageId, client.userId);
  if (!success) return;

  // Remove from memory
  channel.messages.splice(messageIndex, 1);

  // Broadcast deletion
  broadcastToChannel(channelId, {
    type: 'message_deleted',
    messageId: messageId
  });
}

async function handleSearchMessages(ws, data) {
  const client = clients.get(ws);
  if (!client || !client.authenticated) return;

  const { query, channelId, limit } = data;
  const channel = channels.get(channelId);
  if (!channel) return;

  const results = await searchMessages(query, channelId, limit);
  
  ws.send(JSON.stringify({
    type: 'search_results',
    query: query,
    channelId: channelId,
    results: results
  }));
}

// Utility functions
function broadcastToChannel(channelId, message) {
  const channel = channels.get(channelId);
  if (!channel) return;

  const messageStr = JSON.stringify(message);
  channel.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

function broadcastToAll(message) {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(messageStr);
    }
  });
}

// WebSocket connection handler
wss.on('connection', async (ws, req) => {
  const clientId = crypto.randomUUID();
  const ip = req.socket.remoteAddress;
  
  // Rate limiting
  const ipConnectionsCount = ipConnections.get(ip) || 0;
  if (ipConnectionsCount >= MAX_CONNECTIONS_PER_IP) {
    ws.close(1008, 'Too many connections from this IP');
    return;
  }
  ipConnections.set(ip, ipConnectionsCount + 1);

  // Initialize client
  clients.set(ws, {
    id: clientId,
    ws: ws,
    ip: ip,
    authenticated: false,
    userId: null,
    userDetails: null,
    currentChannel: null,
    connectedAt: Date.now()
  });

  logger.info(`Client connected: ${clientId} from ${ip}`);

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      const client = clients.get(ws);

      switch (message.type) {
        case 'authenticate':
          await handleAuthentication(ws, message);
          break;
        case 'join_channel':
          await handleJoinChannel(ws, message);
          break;
        case 'send_message':
          await handleSendMessage(ws, message);
          break;
        case 'edit_message':
          await handleEditMessage(ws, message);
          break;
        case 'delete_message':
          await handleDeleteMessage(ws, message);
          break;
        case 'search_messages':
          await handleSearchMessages(ws, message);
          break;
        case 'typing_start':
          handleTypingIndicator(client.userId, message.channelId, true);
          break;
        case 'typing_stop':
          handleTypingIndicator(client.userId, message.channelId, false);
          break;
        case 'add_reaction':
          await handleAddReaction(ws, message);
          break;
        case 'remove_reaction':
          await handleRemoveReaction(ws, message);
          break;
        default:
          logger.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error('Error handling message:', error);
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      // Update user status to offline
      if (client.userId) {
        updateUserStatus(client.userId, 'offline');
      }

      // Remove from channel
      if (client.currentChannel) {
        const channel = channels.get(client.currentChannel);
        if (channel) {
          channel.clients.delete(ws);
          channel.typing.delete(client.userId);
        }
      }

      // Clean up
      clients.delete(ws);
      ipConnections.set(ip, Math.max(0, (ipConnections.get(ip) || 1) - 1));
    }
    logger.info(`Client disconnected: ${clientId}`);
  });

  ws.on('error', (error) => {
    logger.error(`WebSocket error for client ${clientId}:`, error);
  });
});

// Authentication handler
async function handleAuthentication(ws, message) {
  try {
    const token = message.token;
    const decoded = jwt.verify(token, Buffer.from(JWT_SECRET, 'base64'));
    
    const userDetails = await getUserDetails(decoded.sub);
    
    const client = clients.get(ws);
    client.authenticated = true;
    client.userId = decoded.sub;
    client.userDetails = userDetails;

    // Update user status to online
    updateUserStatus(decoded.sub, 'online');

    ws.send(JSON.stringify({
      type: 'authenticated',
      user: userDetails
    }));

    logger.info(`User authenticated: ${userDetails.username} (${decoded.sub})`);
  } catch (error) {
    logger.error('Authentication error:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication failed'
    }));
  }
}

// Channel joining handler
async function handleJoinChannel(ws, message) {
  const client = clients.get(ws);
  if (!client || !client.authenticated) return;

  const channelId = message.channelId;
  const channel = channels.get(channelId);
  if (!channel) return;

  // Leave current channel
  if (client.currentChannel) {
    const currentChannel = channels.get(client.currentChannel);
    if (currentChannel) {
      currentChannel.clients.delete(ws);
      currentChannel.typing.delete(client.userId);
    }
  }

  // Join new channel
  client.currentChannel = channelId;
  channel.clients.add(ws);

  // Load recent messages
  let recentMessages = channel.messages.slice(-50); // Last 50 messages
  if (dbConnected && recentMessages.length === 0) {
    try {
      const result = await dbClient.query(`
        SELECT cm.message_id, cm.content, cm.created_at, cm.is_edited, cm.reply_to,
               ua.username, upi.first_name, upi.last_name
        FROM chat_messages cm
        JOIN users_auth ua ON cm.user_id = ua.user_id
        LEFT JOIN user_profile_info upi ON ua.user_id = upi.user_id_serial
        WHERE cm.channel_id = $1
        ORDER BY cm.created_at DESC
        LIMIT 50
      `, [channelId]);

      recentMessages = result.rows.map(row => ({
        id: row.message_id,
        content: row.content,
        timestamp: row.created_at,
        isEdited: row.is_edited,
        replyTo: row.reply_to,
        user: {
          username: row.username,
          displayName: row.first_name && row.last_name ? 
            `${row.first_name} ${row.last_name}` : row.username
        }
      })).reverse();
    } catch (error) {
      logger.error('Error loading recent messages:', error);
    }
  }

  // Send channel info and recent messages
  ws.send(JSON.stringify({
    type: 'channel_joined',
    channel: {
      id: channel.id,
      name: channel.name,
      description: channel.description
    },
    recentMessages: recentMessages,
    typingUsers: Array.from(channel.typing),
    onlineUsers: Array.from(channel.clients).map(c => clients.get(c)?.userDetails).filter(Boolean)
  }));

  // Notify others
  broadcastToChannel(channelId, {
    type: 'user_joined',
    user: client.userDetails
  });

  logger.info(`User ${client.userDetails.username} joined channel ${channel.name}`);
}

// Reaction handlers (existing code)
async function handleAddReaction(ws, message) {
  // Implementation for adding reactions
}

async function handleRemoveReaction(ws, message) {
  // Implementation for removing reactions
}

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, async () => {
  await initializeDefaultChannels();
  logger.info(`Enhanced chat server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  wss.close(() => {
    server.close(() => {
      dbClient.end();
      process.exit(0);
    });
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  wss.close(() => {
    server.close(() => {
      dbClient.end();
      process.exit(0);
    });
  });
});
