const WebSocket = require('ws');
const http = require('http');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const winston = require('winston');
// Database connection for user lookup and message persistence
const { Client } = require('pg');
const dbClient = new Client({
  host: process.env.DB_HOST || 'cd6emofiekhlj.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'd4ukv7mqkkc9i1',
  user: process.env.DB_USER || 'u2eb6vlhflq6bt',
  password: process.env.DB_PASS || 'pe9512a0cbf2bc2eee176022c82836beedc48733196d06484e5dc69e2754f5a79',
  ssl: {
    rejectUnauthorized: false // For AWS RDS
  }
});

// Connect to database
let dbConnected = false;
dbClient.connect().then(async () => {
  dbConnected = true;
  logger.info('Database connected successfully');
  
  // Create chat tables if they don't exist
  try {
    const fs = require('fs');
    const path = require('path');
    const sqlFile = fs.readFileSync(path.join(__dirname, 'enhanced_chat_tables.sql'), 'utf8');
    
    // Split SQL file into individual statements
    const statements = sqlFile.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await dbClient.query(statement);
        } catch (sqlError) {
          // Log but don't fail - tables might already exist
          logger.warn(`SQL statement failed (might already exist): ${sqlError.message}`);
        }
      }
    }
    
    logger.info('Chat tables setup completed');
  } catch (error) {
    logger.error('Error reading SQL file:', error);
  }
}).catch(err => {
  logger.warn('Database connection failed, using fallback mode:', err.message);
  dbConnected = false;
});

// Configure logging with better performance
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

// Security configuration - Using same JWT system as Java backend
const JWT_SECRET = '12341234123412341234123412341234123412341234'; // Same as Java backend
const CHAT_ENCRYPTION_KEY = 'super-secure-aes-encryption-key-32';

// Encryption functions
function encryptMessage(content) {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(CHAT_ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex')
    };
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
}

function decryptMessage(encryptedData, iv) {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(CHAT_ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

// Content moderation configuration
const BANNED_WORDS = new Set(['spam', 'scam', 'hack', 'crack', 'illegal', 'drugs', 'weapons']);
const SPAM_PATTERNS = [
  /(.)\1{4,}/, // Repeated characters
  /(https?:\/\/[^\s]+){2,}/, // Multiple URLs
  /(buy|sell|discount|offer|free|money|cash|bitcoin|eth|crypto){3,}/i, // Spam keywords
];
const CAPS_THRESHOLD = 0.7; // 70% caps is shouting

// Performance optimizations
const MAX_CONNECTIONS_PER_IP = 10;
const MESSAGE_RATE_LIMIT = 30; // messages per minute
const CONNECTION_TIMEOUT = 30000; // 30 seconds

// Create HTTP server with performance settings
const server = http.createServer({
  maxHeaderSize: 8192,
  keepAlive: true,
  keepAliveTimeout: 60000,
  maxConnections: 10000
});

// Create WebSocket server with performance optimizations
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
  maxPayload: 1024 * 1024 // 1MB max message size
});

// Store connected clients and channels with better performance
const clients = new Map();
const channels = new Map();
const ipConnections = new Map(); // Track connections per IP
const messageRateLimit = new Map(); // Rate limiting per user
const sessions = new Map(); // In-memory session storage

// Initialize default channels
async function initializeDefaultChannels() {
  if (dbConnected) {
    try {
      // Load channels from database
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
      // Fallback to default channels
      initializeFallbackChannels();
    }
  } else {
    // Fallback to default channels if database not connected
    initializeFallbackChannels();
  }
  
  metrics.channels = channels.size;
  logger.info(`Initialized ${channels.size} channels`);
}

// Fallback channels initialization
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

// Enhanced metrics for monitoring
const metrics = {
  connections: 0,
  messagesSent: 0,
  messagesReceived: 0,
  errors: 0,
  startTime: Date.now(),
  activeUsers: 0,
  channels: 0,
  peakConcurrentUsers: 0,
  averageResponseTime: 0,
  totalDataTransferred: 0,
  rateLimitHits: 0
};

// Health check endpoint with detailed metrics
server.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      uptime: process.uptime(),
      connections: wss.clients.size,
      memory: process.memoryUsage(),
      metrics,
      redis: 'disabled',
      cluster: 'master'
    }));
  } else if (req.url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(metrics));
  } else if (req.url === '/channels') {
    const channelList = Array.from(channels.values()).map(channel => ({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      userCount: channel.clients.size
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(channelList));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Fetch user details from database
async function getUserDetails(userId) {
  if (!dbConnected) {
    logger.warn('Database not connected, using fallback user details');
    return {
      userId: userId,
      username: userId,
      email: `${userId}@example.com`,
      firstName: 'User',
      lastName: userId,
      displayName: `User ${userId}`
    };
  }

  try {
    const query = `
      SELECT ua.user_id, ua.username, ua.email, upi.first_name, upi.last_name
      FROM users_auth ua
      LEFT JOIN user_profile_info upi ON ua.user_id = upi.user_id_serial
      WHERE ua.user_id = $1
    `;
    const result = await dbClient.query(query, [userId]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      return {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        displayName: user.first_name && user.last_name ? 
          `${user.first_name} ${user.last_name}` : user.username
      };
    }
    return null;
  } catch (error) {
    logger.error('Error fetching user details:', error);
    return null;
  }
}

// Save message to database with encryption
async function saveMessageToDatabase(message) {
  if (!dbConnected) {
    logger.warn('Database not connected, message not saved');
    return;
  }

  try {
    // Encrypt the message content
    const encryptionResult = encryptMessage(message.content);
    
    if (encryptionResult) {
      await dbClient.query(`
        INSERT INTO chat_messages (message_id, channel_id, user_id, content, encrypted_content, encryption_iv, is_encrypted, thread_id, reply_to)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        message.id, 
        message.channelId, 
        message.userId, 
        message.content, // Keep original for fallback
        encryptionResult.encrypted,
        encryptionResult.iv,
        true, // is_encrypted
        message.threadId, 
        message.replyTo
      ]);
      
      logger.info(`Encrypted message saved to database: ${message.id}`);
    } else {
      // Fallback to unencrypted if encryption fails
      await dbClient.query(`
        INSERT INTO chat_messages (message_id, channel_id, user_id, content, is_encrypted, thread_id, reply_to)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [message.id, message.channelId, message.userId, message.content, false, message.threadId, message.replyTo]);
      
      logger.warn(`Unencrypted message saved to database (encryption failed): ${message.id}`);
    }
  } catch (error) {
    logger.error('Error saving message to database:', error);
  }
}

// Load messages from database with decryption
async function loadMessagesFromDatabase(channelId, limit = 50) {
  if (!dbConnected) {
    logger.warn('Database not connected, using in-memory messages');
    return [];
  }

  try {
    const result = await dbClient.query(`
      SELECT 
        cm.message_id as id, 
        cm.channel_id as "channelId", 
        cm.user_id as "userId", 
        ua.username,
        cm.content,
        cm.encrypted_content,
        cm.encryption_iv,
        cm.is_encrypted,
        cm.created_at as "timestamp",
        cm.is_edited as "isEdited",
        cm.edited_at as "editedAt",
        cm.thread_id as "threadId",
        cm.reply_to as "replyTo"
      FROM chat_messages cm
      JOIN users_auth ua ON cm.user_id = ua.user_id
      WHERE cm.channel_id = $1 
      ORDER BY cm.created_at DESC 
      LIMIT $2
    `, [channelId, limit]);
    
    // Convert to message format and reverse to get chronological order
    const messages = result.rows.reverse().map(row => {
      let content = row.content;
      
      // Decrypt if message is encrypted
      if (row.is_encrypted && row.encrypted_content && row.encryption_iv) {
        const decrypted = decryptMessage(row.encrypted_content, row.encryption_iv);
        if (decrypted) {
          content = decrypted;
        } else {
          logger.warn(`Failed to decrypt message ${row.id}, using fallback content`);
        }
      }
      
      return {
        id: row.id,
        channelId: row.channelId,
        userId: row.userId,
        username: row.username,
        content: content,
        timestamp: row.timestamp,
        isEdited: row.isEdited || false,
        editedAt: row.editedAt,
        threadId: row.threadId,
        replyTo: row.replyTo,
        reactions: [],
        readReceipts: []
      };
    });
    
    logger.info(`Loaded ${messages.length} messages from database for channel: ${channelId}`);
    return messages;
  } catch (error) {
    logger.error('Error loading messages from database:', error);
    return [];
  }
}

// Token validation - using same JWT system as Java backend
function validateToken(token) {
  try {
    // Decode the base64 key and verify JWT using HMAC-SHA256
    const secretKey = Buffer.from(JWT_SECRET, 'base64');
    const decoded = jwt.verify(token, secretKey, { algorithms: ['HS256'] });
    
    // Extract user information from JWT
    return {
      userId: decoded.sub, // Subject contains user ID
      username: decoded.sub, // For now, use user ID as username
      email: decoded.sub, // For now, use user ID as email
      exp: decoded.exp * 1000, // Convert to milliseconds
      jti: decoded.jti // JWT ID for revocation tracking
    };
  } catch (error) {
    logger.warn('JWT validation failed:', error.message);
    return null;
  }
}

// Rate limiting function
function checkRateLimit(userId, clientId) {
  const now = Date.now();
  const userKey = `rate_limit:${userId}`;
  const clientKey = `rate_limit:${clientId}`;
  
  // Get current rate limit data
  const userMessages = messageRateLimit.get(userKey) || [];
  const clientMessages = messageRateLimit.get(clientKey) || [];
  
  // Clean old messages (older than 1 minute)
  const recentUserMessages = userMessages.filter(time => now - time < 60000);
  const recentClientMessages = clientMessages.filter(time => now - time < 60000);
  
  // Check limits
  if (recentUserMessages.length >= MESSAGE_RATE_LIMIT || recentClientMessages.length >= MESSAGE_RATE_LIMIT) {
    metrics.rateLimitHits++;
    return false;
  }
  
  // Update rate limit data
  recentUserMessages.push(now);
  recentClientMessages.push(now);
  messageRateLimit.set(userKey, recentUserMessages);
  messageRateLimit.set(clientKey, recentClientMessages);
  
  return true;
}

// Content moderation functions
function checkMessageModeration(content) {
  const lowerContent = content.toLowerCase();
  const words = lowerContent.split(/\s+/);
  
  // Check for banned words
  const bannedWordCount = words.filter(word => BANNED_WORDS.has(word)).length;
  if (bannedWordCount > 0) {
    return {
      isAppropriate: false,
      reason: `Contains ${bannedWordCount} banned word(s)`,
      action: bannedWordCount > 2 ? 'DELETE' : 'WARN',
      confidence: 0.9
    };
  }

  // Check for spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isAppropriate: false,
        reason: 'Detected spam pattern',
        action: 'DELETE',
        confidence: 0.8
      };
    }
  }

  // Check for excessive caps (shouting)
  const capsCount = (content.match(/[A-Z]/g) || []).length;
  const totalLetters = (content.match(/[A-Za-z]/g) || []).length;
  if (totalLetters > 0 && capsCount / totalLetters > CAPS_THRESHOLD) {
    return {
      isAppropriate: false,
      reason: 'Excessive use of capital letters',
      action: 'WARN',
      confidence: 0.6
    };
  }

  // Check message length
  if (content.length > 1000) {
    return {
      isAppropriate: false,
      reason: 'Message too long (max 1000 characters)',
      action: 'WARN',
      confidence: 0.7
    };
  }

  // Check for empty or whitespace-only messages
  if (content.trim().length === 0) {
    return {
      isAppropriate: false,
      reason: 'Empty message',
      action: 'DELETE',
      confidence: 1.0
    };
  }

  // Message is appropriate
  return {
    isAppropriate: true,
    action: 'ALLOW',
    confidence: 1.0
  };
}

// IP connection limiting
function checkConnectionLimit(ip) {
  const currentConnections = ipConnections.get(ip) || 0;
  if (currentConnections >= MAX_CONNECTIONS_PER_IP) {
    return false;
  }
  ipConnections.set(ip, currentConnections + 1);
  return true;
}

// WebSocket connection handling with enhanced features
wss.on('connection', (ws, req) => {
  const clientId = crypto.randomUUID();
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  // Check connection limits
  if (!checkConnectionLimit(clientIp)) {
    logger.warn(`Connection limit exceeded for IP: ${clientIp}`);
    ws.close(1008, 'Connection limit exceeded');
    return;
  }
  
  logger.info(`New WebSocket connection: ${clientId} from ${clientIp}`);
  metrics.connections++;
  
  // Set connection timeout
  const connectionTimeout = setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      logger.warn(`Connection timeout for client: ${clientId}`);
      ws.close(1000, 'Connection timeout');
    }
  }, CONNECTION_TIMEOUT);
  
  ws.on('message', async (data) => {
    try {
      const startTime = Date.now();
      const message = JSON.parse(data);
      metrics.messagesReceived++;
      
      // Check rate limiting
      const client = clients.get(clientId);
      if (client && !checkRateLimit(client.user.userId, clientId)) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Rate limit exceeded. Please slow down.'
        }));
        return;
      }
      
      await handleMessage(ws, message, clientId);
      
      // Update average response time
      const responseTime = Date.now() - startTime;
      metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2;
      
    } catch (error) {
      logger.error('Error processing message:', error);
      metrics.errors++;
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Internal server error'
      }));
    }
  });
  
  ws.on('close', () => {
    clearTimeout(connectionTimeout);
    logger.info(`Client disconnected: ${clientId}`);
    
    // Update connection count for IP
    const currentConnections = ipConnections.get(clientIp) || 0;
    ipConnections.set(clientIp, Math.max(0, currentConnections - 1));
    
    // Get client info before deleting
    const client = clients.get(clientId);
    
    // Notify other users in all channels this user was in
    if (client) {
      client.channels.forEach(channelId => {
        const channel = channels.get(channelId);
        if (channel) {
          channel.clients.delete(clientId);
          broadcastToChannel(channelId, {
            type: 'user_left',
            user: {
              id: client.user.userId,
              username: client.user.username
            },
            timestamp: new Date().toISOString()
          });
        }
      });
      
      // Remove from session storage
      sessions.delete(client.user.userId);
    }
    
    clients.delete(clientId);
    
    // Update metrics
    metrics.activeUsers = clients.size;
    if (metrics.activeUsers > metrics.peakConcurrentUsers) {
      metrics.peakConcurrentUsers = metrics.activeUsers;
    }
    
    // Clean up rate limiting
    messageRateLimit.delete(`rate_limit:${clientId}`);
  });
  
  ws.on('error', (error) => {
    logger.error(`WebSocket error for client ${clientId}:`, error);
    metrics.errors++;
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    clientId,
    timestamp: new Date().toISOString()
  }));
});

async function handleMessage(ws, message, clientId) {
  const { type, ...data } = message;
  
  switch (type) {
    case 'authenticate':
      await handleAuthentication(ws, data, clientId);
      break;
      
    case 'join_channel':
      await handleJoinChannel(ws, data, clientId);
      break;
      
    case 'send_message':
      await handleSendMessage(ws, data, clientId);
      break;
      
    case 'typing':
      await handleTyping(ws, data, clientId);
      break;
      
    case 'mark_as_read':
      await handleMarkAsRead(ws, data, clientId);
      break;
      
    case 'add_reaction':
      await handleAddReaction(ws, data, clientId);
      break;
      
    case 'remove_reaction':
      await handleRemoveReaction(ws, data, clientId);
      break;
      
    case 'moderate_message':
      await handleModerateMessage(ws, data, clientId);
      break;
      
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
      
    default:
      logger.warn(`Unknown message type: ${type}`);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type'
      }));
  }
}

async function handleAuthentication(ws, data, clientId) {
  const { token } = data;
  
  if (!token) {
    ws.send(JSON.stringify({
      type: 'auth_error',
      message: 'No token provided'
    }));
    return;
  }
  
  const tokenData = validateToken(token);
  if (!tokenData) {
    ws.send(JSON.stringify({
      type: 'auth_error',
      message: 'Invalid token'
    }));
    return;
  }
  
  // Fetch user details from database
  const userDetails = await getUserDetails(tokenData.userId);
  if (!userDetails) {
    ws.send(JSON.stringify({
      type: 'auth_error',
      message: 'User not found in database'
    }));
    return;
  }
  
  // Combine token data with user details
  const user = {
    ...tokenData,
    ...userDetails
  };
  
  // Check if user is already connected elsewhere
  const existingSession = sessions.get(user.userId);
  if (existingSession && existingSession !== clientId) {
    // Notify existing connection to disconnect
    const existingClient = clients.get(existingSession);
    if (existingClient && existingClient.ws.readyState === WebSocket.OPEN) {
      existingClient.ws.send(JSON.stringify({
        type: 'session_conflict',
        message: 'You have been logged in elsewhere'
      }));
      existingClient.ws.close(1000, 'Session conflict');
    }
  }
  
  // Store client information
  clients.set(clientId, {
    ws,
    user,
    channels: new Set(),
    lastActivity: Date.now()
  });
  
  // Store session in memory
  sessions.set(user.userId, clientId);
  
  metrics.activeUsers = clients.size;
  if (metrics.activeUsers > metrics.peakConcurrentUsers) {
    metrics.peakConcurrentUsers = metrics.activeUsers;
  }
  
  logger.info(`User authenticated: ${user.username} (${clientId})`);
  
  ws.send(JSON.stringify({
    type: 'authenticated',
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

async function handleJoinChannel(ws, data, clientId) {
  const client = clients.get(clientId);
  if (!client) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Not authenticated'
    }));
    return;
  }
  
  const { channelId, channelName } = data;
  const channelKey = channelId || channelName;
  
  if (!channels.has(channelKey)) {
    channels.set(channelKey, {
      id: channelKey,
      name: channelName || channelKey,
      clients: new Set(),
      messages: [],
      typing: new Set()
    });
    metrics.channels = channels.size;
  }
  
  const channel = channels.get(channelKey);
  channel.clients.add(clientId);
  client.channels.add(channelKey);
  
  logger.info(`User ${client.user.username} joined channel: ${channelKey}`);
  
  // Get current online users in this channel
  const onlineUsers = Array.from(channel.clients).map(clientId => {
    const client = clients.get(clientId);
    return client ? {
      id: client.user.userId,
      username: client.user.username
    } : null;
  }).filter(Boolean);

  // Load messages from database
  const dbMessages = await loadMessagesFromDatabase(channelKey, 50);
  
  // Update in-memory channel messages with database messages
  if (dbMessages.length > 0) {
    channel.messages = dbMessages;
  }
  
  const recentMessages = channel.messages.slice(-50);
  ws.send(JSON.stringify({
    type: 'channel_joined',
    channel: {
      id: channelKey,
      name: channel.name
    },
    messages: recentMessages,
    onlineUsers: onlineUsers,
    timestamp: new Date().toISOString()
  }));
  
  // Notify other users
  broadcastToChannel(channelKey, {
    type: 'user_joined',
    user: {
      id: client.user.userId,
      username: client.user.username
    },
    timestamp: new Date().toISOString()
  }, clientId);
}

async function handleSendMessage(ws, data, clientId) {
  const client = clients.get(clientId);
  if (!client) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Not authenticated'
    }));
    return;
  }
  
  const { channelId, content, messageId, threadId, replyTo } = data;
  
  if (!content || !channelId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Missing required fields'
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
  
  const channel = channels.get(channelId);
  if (!channel) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Channel not found'
    }));
    return;
  }
  
  // Create message in memory
  const msgId = crypto.randomUUID();
  const message = {
    id: msgId,
    content: content,
    channelId: channelId,
    userId: client.user.userId,
    username: client.user.username,
    timestamp: new Date().toISOString(),
    isEdited: false,
    editedAt: null,
    threadId: threadId || null,
    replyTo: replyTo || null,
    reactions: [],
    readReceipts: []
  };
  
  // Store message in channel (in-memory for real-time)
  channel.messages.push(message);
  if (channel.messages.length > 1000) {
    channel.messages = channel.messages.slice(-500); // Keep last 500 messages
  }
  
  // Save message to database
  await saveMessageToDatabase(message);
  
  metrics.messagesSent++;
  metrics.totalDataTransferred += Buffer.byteLength(JSON.stringify(message));
  
  // Broadcast to channel
  broadcastToChannel(channelId, {
    type: 'new_message',
    message: message,
    timestamp: new Date().toISOString()
  });
  
  logger.info(`Message sent in ${channelId} by ${client.user.username}`);
}

async function handleTyping(ws, data, clientId) {
  const client = clients.get(clientId);
  if (!client) return;
  
  const { channelId, isTyping } = data;
  const channel = channels.get(channelId);
  
  if (!channel) return;
  
  if (isTyping) {
    channel.typing.add(client.user.username);
  } else {
    channel.typing.delete(client.user.username);
  }
  
  // Broadcast typing status
  broadcastToChannel(channelId, {
    type: 'typing_update',
    typing: Array.from(channel.typing),
    timestamp: new Date().toISOString()
  }, clientId);
}

async function handleMarkAsRead(ws, data, clientId) {
  const client = clients.get(clientId);
  if (!client) return;
  
  const { messageId, channelId } = data;
  
  // Store read receipt in memory (simplified)
  if (messageId) {
    // In a real implementation, this would be stored in Redis
    logger.info(`Message ${messageId} marked as read by ${client.user.username}`);
  }
}

// Reaction handling functions
async function handleAddReaction(ws, data, clientId) {
  const client = clients.get(clientId);
  if (!client) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Not authenticated'
    }));
    return;
  }
  
  const { messageId, emoji } = data;
  
  if (!messageId || !emoji) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Missing messageId or emoji'
    }));
    return;
  }
  
  // Add reaction in memory
  const reactionId = crypto.randomUUID();
  const reaction = {
    id: reactionId,
    emoji: emoji,
    userId: client.user.userId,
    username: client.user.username,
    messageId: messageId,
    timestamp: new Date().toISOString()
  };
  
  // Broadcast reaction to all clients
  broadcastToAll({
    type: 'reaction_added',
    reaction: reaction
  });
  
  logger.info(`Reaction ${emoji} added to message ${messageId} by ${client.user.username}`);
}

async function handleRemoveReaction(ws, data, clientId) {
  const client = clients.get(clientId);
  if (!client) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Not authenticated'
    }));
    return;
  }
  
  const { messageId, emoji } = data;
  
  if (!messageId || !emoji) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Missing messageId or emoji'
    }));
    return;
  }
  
  // Remove reaction in memory (simplified)
  // Broadcast reaction removal to all clients
  broadcastToAll({
    type: 'reaction_removed',
    data: {
      userId: client.user.userId,
      messageId: messageId,
      emoji: emoji
    }
  });
  
  logger.info(`Reaction ${emoji} removed from message ${messageId} by ${client.user.username}`);
}

// Moderation functions
async function handleModerateMessage(ws, data, clientId) {
  const client = clients.get(clientId);
  if (!client) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Not authenticated'
    }));
    return;
  }
  
  // Check if user is moderator or admin
  if (client.user.role !== 'MODERATOR' && client.user.role !== 'ADMIN') {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Insufficient permissions'
    }));
    return;
  }
  
  const { messageId, action, reason } = data;
  
  if (!messageId || !action) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Missing messageId or action'
    }));
    return;
  }
  
  // Moderate message in memory (simplified)
  // Broadcast moderation action to all clients
  broadcastToAll({
    type: 'message_moderated',
    data: {
      messageId: messageId,
      action: action,
      reason: reason,
      moderatedBy: client.user.username,
      timestamp: new Date().toISOString()
    }
  });
  
  logger.info(`Message ${messageId} moderated by ${client.user.username} with action: ${action}`);
}

function broadcastToAll(message) {
  const messageStr = JSON.stringify(message);
  const messageSize = Buffer.byteLength(messageStr);
  
  clients.forEach((client, clientId) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(messageStr);
        metrics.totalDataTransferred += messageSize;
      } catch (error) {
        logger.error('Error broadcasting to client:', error);
      }
    }
  });
}

function broadcastToChannel(channelId, message, excludeClientId = null) {
  const channel = channels.get(channelId);
  if (!channel) return;
  
  const messageStr = JSON.stringify(message);
  const messageSize = Buffer.byteLength(messageStr);
  
  channel.clients.forEach(clientId => {
    if (clientId === excludeClientId) return;
    
    const client = clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(messageStr);
        metrics.totalDataTransferred += messageSize;
      } catch (error) {
        logger.error('Error sending message to client:', error);
      }
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Close all WebSocket connections
  wss.clients.forEach(client => {
    client.close(1000, 'Server shutting down');
  });
  
  // Close server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  // Close all WebSocket connections
  wss.clients.forEach(client => {
    client.close(1000, 'Server shutting down');
  });
  
  // Close server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const port = process.env.PORT || 3001;
console.log('Starting production-ready chat server (No Redis)...');
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV || 'production',
  JWT_SECRET_LENGTH: JWT_SECRET.length,
  CHAT_ENCRYPTION_KEY_LENGTH: CHAT_ENCRYPTION_KEY.length,
  REDIS: 'disabled'
});

server.listen(port, async () => {
  console.log(`🚀 Production chat server running on port ${port}`);
  logger.info(`Production chat server running on port ${port}`);
  logger.info(`Environment: production`);
  logger.info(`Active connections: ${wss.clients.size}`);
  logger.info(`Redis: disabled (using in-memory storage)`);
  
  // Initialize default channels
  await initializeDefaultChannels();
});

module.exports = { wss, server, metrics };

