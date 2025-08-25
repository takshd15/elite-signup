// Load environment variables
require('dotenv').config();

const WebSocket = require('ws');
const http = require('http');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const winston = require('winston');
const os = require('os');

// Enhanced database connection pool
const { Pool } = require('pg');
const dbPool = new Pool({
  host: process.env.DB_HOST || 'cd6emofiekhlj.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'd4ukv7mqkkc9i1',
  user: process.env.DB_USER || 'u2eb6vlhflq6bt',
  password: process.env.DB_PASS || 'pe9512a0cbf2bc2eee176022c82836beedc48733196d06484e5dc69e2754f5a79',
  ssl: {
    rejectUnauthorized: false
  },
  // Connection pool settings
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  min: parseInt(process.env.DB_MIN_CONNECTIONS) || 2,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
  maxUses: parseInt(process.env.DB_MAX_USES) || 7500,
  allowExitOnIdle: true,
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000
});

// Enhanced rate limiting
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.messageLimits = new Map();
  }

  checkIPRateLimit(ip, maxRequests = 100, windowMs = 900000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(ip)) {
      this.requests.set(ip, []);
    }
    
    const requests = this.requests.get(ip);
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(ip, recentRequests);
    return true;
  }

  checkMessageRateLimit(userId, maxMessages = 30, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.messageLimits.has(userId)) {
      this.messageLimits.set(userId, []);
    }
    
    const messages = this.messageLimits.get(userId);
    const recentMessages = messages.filter(time => time > windowStart);
    
    if (recentMessages.length >= maxMessages) {
      return false;
    }
    
    recentMessages.push(now);
    this.messageLimits.set(userId, recentMessages);
    return true;
  }

  cleanup() {
    const now = Date.now();
    
    for (const [ip, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => now - time < 900000);
      if (recentRequests.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, recentRequests);
      }
    }
    
    for (const [userId, messages] of this.messageLimits.entries()) {
      const recentMessages = messages.filter(time => now - time < 60000);
      if (recentMessages.length === 0) {
        this.messageLimits.delete(userId);
      } else {
        this.messageLimits.set(userId, recentMessages);
      }
    }
  }
}

// Input validation
class InputValidator {
  static validateMessage(message) {
    const errors = [];
    let field = 'general';
    
    // Validate content
    if (!message.content) {
      errors.push('Message content is required');
      field = 'content';
    } else if (typeof message.content !== 'string') {
      errors.push('Message content must be a string');
      field = 'content';
    } else if (message.content.trim().length === 0) {
      errors.push('Message content cannot be empty');
      field = 'content';
    } else if (message.content.length > 1000) {
      errors.push(`Message content cannot exceed 1000 characters (current: ${message.content.length})`);
      field = 'content';
    }
    
    // Validate recipient ID
    if (!message.recipientId) {
      errors.push('Recipient ID is required');
      field = 'recipientId';
    } else if (typeof message.recipientId !== 'string') {
      errors.push('Recipient ID must be a string');
      field = 'recipientId';
    } else if (message.recipientId.trim().length === 0) {
      errors.push('Recipient ID cannot be empty');
      field = 'recipientId';
    }
    
    // Check for harmful content - improved XSS detection
    const harmfulPatterns = [
      { pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, name: 'script tags' },
      { pattern: /javascript:/gi, name: 'javascript protocol' },
      { pattern: /on\w+\s*=/gi, name: 'event handlers' },
      { pattern: /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, name: 'iframe tags' },
      { pattern: /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, name: 'object tags' },
      { pattern: /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, name: 'embed tags' },
      { pattern: /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, name: 'link tags' },
      { pattern: /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi, name: 'meta tags' }
    ];
    
    // Check for harmful patterns if content contains HTML-like content or suspicious patterns
    if (/[<>]/.test(message.content) || /script|javascript|on\w+\s*=|iframe|object|embed/i.test(message.content)) {
      for (const { pattern, name } of harmfulPatterns) {
        if (pattern.test(message.content)) {
          errors.push(`Message contains potentially harmful content: ${name}`);
          field = 'content';
          break;
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors,
      field: field,
      sanitizedContent: this.sanitizeContent(message.content)
    };
  }

  static sanitizeContent(content) {
    if (!content) return '';
    
    let sanitized = content.replace(/<[^>]*>/g, '');
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    
    return sanitized.trim();
  }

  static validateJWTToken(token) {
    if (!token || typeof token !== 'string') {
      return { isValid: false, error: 'Token is required and must be a string' };
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, error: 'Invalid JWT token format' };
    }
    
    try {
      parts.forEach(part => {
        if (part) {
          Buffer.from(part, 'base64');
        }
      });
    } catch (error) {
      return { isValid: false, error: 'Invalid JWT token encoding' };
    }
    
    return { isValid: true };
  }

  static validateUserId(userId) {
    if (!userId || typeof userId !== 'string') {
      return { isValid: false, error: 'User ID is required and must be a string' };
    }
    
    const userIdPattern = /^[a-zA-Z0-9_-]+$/;
    if (!userIdPattern.test(userId)) {
      return { isValid: false, error: 'Invalid user ID format' };
    }
    
    if (userId.length > 255) {
      return { isValid: false, error: 'User ID too long' };
    }
    
    return { isValid: true };
  }
}

// Security utilities
class SecurityUtils {
  static validateIP(ip) {
    if (!ip) return false;
    
    const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipv4Pattern.test(ip)) return true;
    
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (ipv6Pattern.test(ip)) return true;
    
    return false;
  }

  static detectSuspiciousActivity(clientData) {
    const warnings = [];
    
    if (clientData.messageCount > 50) {
      warnings.push('High message frequency detected');
    }
    
    if (clientData.failedAuthAttempts > 5) {
      warnings.push('Multiple failed authentication attempts');
    }
    
    if (clientData.connectionsPerMinute > 10) {
      warnings.push('Unusual connection frequency');
    }
    
    return warnings;
  }
}

// Initialize security components
const rateLimiter = new RateLimiter();

// Performance configuration from environment
const MAX_CONNECTIONS_PER_IP = parseInt(process.env.MAX_CONNECTIONS_PER_IP) || 10;
const MESSAGE_RATE_LIMIT = parseInt(process.env.MESSAGE_RATE_LIMIT) || 30;
const CONNECTION_TIMEOUT = parseInt(process.env.CONNECTION_TIMEOUT) || 30000;
const MAX_PAYLOAD_SIZE = parseInt(process.env.MAX_PAYLOAD_SIZE) || 1048576; // 1MB
const KEEP_ALIVE_TIMEOUT = parseInt(process.env.KEEP_ALIVE_TIMEOUT) || 60000;
const MAX_CONNECTIONS = parseInt(process.env.MAX_CONNECTIONS) || 10000;

// Initialize database pool
let dbConnected = false;
dbPool.connect().then(async (client) => {
  try {
    await client.query('SELECT NOW()');
    client.release();
    dbConnected = true;
    logger.info('Database pool initialized successfully');
    
    // Create private messaging tables if they don't exist
    try {
      const fs = require('fs');
      const path = require('path');
      const sqlFile = fs.readFileSync(path.join(__dirname, 'private_messaging_tables.sql'), 'utf8');
      
      // Better SQL parsing that handles functions with semicolons
      const statements = [];
      let currentStatement = '';
      let inFunction = false;
      let dollarQuoteLevel = 0;
      
      const lines = sqlFile.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip comments and empty lines
        if (trimmedLine.startsWith('--') || trimmedLine === '') {
          continue;
        }
        
        // Check for dollar quoting ($$)
        const dollarQuotes = (line.match(/\$\$/g) || []).length;
        if (dollarQuotes > 0) {
          dollarQuoteLevel += dollarQuotes;
          inFunction = dollarQuoteLevel % 2 === 1;
        }
        
        currentStatement += line + '\n';
        
        // Only split on semicolons if we're not inside a function
        if (line.includes(';') && !inFunction) {
          const cleanStatement = currentStatement.trim();
          if (cleanStatement) {
            statements.push(cleanStatement);
          }
          currentStatement = '';
        }
      }
      
      // Add any remaining statement
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await dbPool.query(statement);
          } catch (sqlError) {
            logger.warn(`SQL statement failed (might already exist): ${sqlError.message}`);
          }
        }
      }
      
      logger.info('Private messaging tables setup completed');
    } catch (error) {
      logger.error('Error reading SQL file:', error);
    }
  } catch (error) {
    logger.error('Database pool test failed:', error.message);
    dbConnected = false;
  }
}).catch(err => {
  logger.warn('Database pool connection failed, using fallback mode:', err.message);
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
  /(.)\1{20,}/, // Repeated characters (more lenient - 20+ repetitions)
  /(https?:\/\/[^\s]+){3,}/, // Multiple URLs (3+ URLs)
  /(buy|sell|discount|offer|free|money|cash|bitcoin|eth|crypto){4,}/i, // Spam keywords (4+ occurrences)
];
const CAPS_THRESHOLD = 0.7; // 70% caps is shouting

// Performance optimizations (using environment variables defined above)

// Create HTTP server with performance settings
const server = http.createServer({
  maxHeaderSize: 8192,
  keepAlive: true,
  keepAliveTimeout: KEEP_ALIVE_TIMEOUT,
  maxConnections: MAX_CONNECTIONS
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
  maxPayload: MAX_PAYLOAD_SIZE // 1MB max message size
});

// Store connected clients and conversations with better performance
const clients = new Map(); // clientId -> { ws, user, clientIp, lastActivity }
const userConnections = new Map(); // userId -> clientId
const conversations = new Map(); // conversationId -> { participants: Set, messages: [] }
const ipConnections = new Map(); // Track connections per IP
const messageRateLimit = new Map(); // Rate limiting per user
const sessions = new Map(); // In-memory session storage

// Generate conversation ID for two users
function generateConversationId(userId1, userId2) {
  const sortedIds = [userId1, userId2].sort();
  return `conv_${sortedIds[0]}_${sortedIds[1]}`;
}

// Enhanced metrics for monitoring
const metrics = {
  connections: 0,
  messagesSent: 0,
  messagesReceived: 0,
  errors: 0,
  startTime: Date.now(),
  activeUsers: 0,
  conversations: 0,
  peakConcurrentUsers: 0,
  averageResponseTime: 0,
  totalDataTransferred: 0,
  rateLimitHits: 0
};

// Enhanced health check endpoints
server.on('request', (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  if (url.pathname === '/health') {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      connections: wss.clients.size,
      memory: process.memoryUsage(),
      platform: {
        node: process.version,
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        loadAverage: os.loadavg(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem()
      },
      metrics,
      database: {
        connected: dbConnected,
        pool: {
          totalCount: dbPool.totalCount,
          idleCount: dbPool.idleCount,
          waitingCount: dbPool.waitingCount
        }
      },
      security: {
        rateLimitHits: metrics.rateLimitHits || 0,
        securityWarnings: metrics.securityWarnings || 0
      }
    };
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify(health, null, 2));
  } else if (url.pathname === '/metrics') {
    const detailedMetrics = {
      ...metrics,
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: {
          loadAverage: os.loadavg(),
          freeMemory: os.freemem(),
          totalMemory: os.totalmem(),
          cpus: os.cpus().length
        }
      },
      database: {
        connected: dbConnected,
        pool: {
          totalCount: dbPool.totalCount,
          idleCount: dbPool.idleCount,
          waitingCount: dbPool.waitingCount
        }
      }
    };
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify(detailedMetrics, null, 2));
  } else if (url.pathname === '/ready') {
    const readiness = {
      ready: dbConnected && wss.clients.size >= 0,
      timestamp: new Date().toISOString(),
      checks: [
        { name: 'database', status: dbConnected ? 'healthy' : 'unhealthy' },
        { name: 'websocket', status: 'healthy' },
        { name: 'memory', status: 'healthy' }
      ]
    };
    
    res.writeHead(readiness.ready ? 200 : 503, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify(readiness, null, 2));
  } else if (url.pathname === '/live') {
    const liveness = {
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify(liveness, null, 2));
  } else if (url.pathname === '/users') {
    const userList = Array.from(userConnections.keys()).map(userId => {
      const client = clients.get(userConnections.get(userId));
      return {
        userId: userId,
        username: client?.user?.username || userId,
        online: !!client,
        lastActivity: client?.lastActivity
      };
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(userList));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Fetch user details from database - same logic as Java backend
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
    // First try to get user from main user tables (Java backend tables)
    let query = `
      SELECT ua.user_id, ua.username, ua.email, upi.first_name, upi.last_name
      FROM users_auth ua
      LEFT JOIN user_profile_info upi ON ua.user_id = upi.user_id_serial
      WHERE ua.user_id = $1
    `;
    let result = await dbPool.query(query, [userId]);
    
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
    
    // If not found in main tables, try chat_users table (fallback)
    query = `
      SELECT user_id, username, email, first_name, last_name, display_name
      FROM chat_users
      WHERE user_id = $1
    `;
    result = await dbPool.query(query, [userId]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      return {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        displayName: user.display_name || user.username
      };
    }
    
    return null;
  } catch (error) {
    // If tables don't exist, use fallback user details
    if (error.code === '42P01') { // relation does not exist
      logger.warn('User tables do not exist, using fallback user details');
      return {
        userId: userId,
        username: userId,
        email: `${userId}@example.com`,
        firstName: 'User',
        lastName: userId,
        displayName: `User ${userId}`
      };
    }
    // If there's a type conversion error (string to int), use fallback
    if (error.code === '22P02') { // invalid input syntax for type
      logger.warn(`User ID type conversion error for ${userId}, using fallback user details`);
      return {
        userId: userId,
        username: userId,
        email: `${userId}@example.com`,
        firstName: 'User',
        lastName: userId,
        displayName: `User ${userId}`
      };
    }
    logger.error('Error fetching user details:', error);
    return null;
  }
}

// Save private message to database with encryption
async function savePrivateMessageToDatabase(message) {
  if (!dbConnected) {
    logger.warn('Database not connected, message not saved');
    return;
  }

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
      
      logger.info(`Encrypted private message saved to database: ${message.id}`);
         } else {
       // Fallback to unencrypted if encryption fails
       await dbPool.query(`
         INSERT INTO private_messages (message_id, conversation_id, sender_id, recipient_id, content, is_encrypted, is_read, reply_to)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       `, [message.id, message.conversationId, message.senderId, message.recipientId, message.content, false, false, message.replyTo || null]);
      
      logger.warn(`Unencrypted private message saved to database (encryption failed): ${message.id}`);
    }
  } catch (error) {
    logger.error('Error saving private message to database:', error);
  }
}

// Load private messages from database with decryption
async function loadPrivateMessagesFromDatabase(conversationId, limit = 50) {
  if (!dbConnected) {
    logger.warn('Database not connected, using in-memory messages');
    return [];
  }

  try {
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
          logger.warn(`Failed to decrypt message ${row.id}, using fallback content`);
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
    
    logger.info(`Loaded ${messages.length} private messages from database for conversation: ${conversationId}`);
    return messages;
  } catch (error) {
    logger.error('Error loading private messages from database:', error);
    return [];
  }
}

// JWT verification for chat server - microservice approach
// Each service verifies JWT tokens independently using the same logic as backend
async function verifyJWTWithBackend(token, clientIp) {
  try {
    // 1. Validate JWT signature and expiration (same as Java backend)
    if (!validateToken(token)) {
      return { valid: false, error: 'Invalid token signature or expired' };
    }

    // 2. Extract user ID and JTI (same as Java backend)
    const userId = extractUserId(token);
    const jti = extractJti(token);

    // 3. Check if JTI is revoked in database (microservice approach)
    // Search jwt_revocation table - if JTI is found = revoked, if not found = valid
    const isRevoked = await checkJTIRevoked(jti);
    if (isRevoked) {
      return { valid: false, error: 'Token has been revoked' };
    }

    // 4. Get user details from database
    const userDetails = await getUserDetails(userId);
    if (!userDetails) {
      return { valid: false, error: 'User not found in database' };
    }

    // 5. For microservice approach - no verification code check needed
    // Users are already logged in and have valid JWT tokens
    // This is like Instagram where logged-in users can access chat immediately

    return {
      valid: true,
      user: userDetails
    };

  } catch (error) {
    logger.error('JWT verification error:', error.message);
    return { valid: false, error: 'Token validation failed' };
  }
}

// JWT validation functions - microservice approach (same logic as Java backend)
function validateToken(token) {
  try {
    // Use JWT_SECRET directly as string (same as Java backend)
    jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    return true;
  } catch (error) {
    return false;
  }
}

function extractUserId(token) {
  try {
    // Use JWT_SECRET directly as string (same as Java backend)
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    return decoded.sub; // subject contains user ID (same as Java backend)
  } catch (error) {
    throw new Error('Failed to extract user ID from token');
  }
}

function extractJti(token) {
  try {
    // Use JWT_SECRET directly as string (same as Java backend)
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    return decoded.jti; // JWT ID (same as Java backend)
  } catch (error) {
    throw new Error('Failed to extract JTI from token');
  }
}

// Check if JTI is revoked in database - microservice approach
// Search jwt_revocation table for JTI
// If JTI is found in table = revoked (return true)
// If JTI is NOT found in table = valid/not revoked (return false)
// This matches the Java backend TokenRevocationHandler logic
async function checkJTIRevoked(jti) {
  try {
    const result = await dbPool.query(
      'SELECT 1 FROM jwt_revocation WHERE jti = $1 LIMIT 1',
      [jti]
    );
    // If JTI is found in revocation table = revoked (return true)
    // If JTI is NOT found = valid/not revoked (return false)
    return result.rows.length > 0;
  } catch (error) {
    // If table doesn't exist or other database error, assume not revoked
    if (error.code === '42P01') { // relation does not exist
      logger.warn('JWT revocation table does not exist, assuming token not revoked');
      return false;
    }
    logger.error('Error checking JTI revocation:', error);
    return false; // If we can't check, assume not revoked
  }
}

// Note: Verification code check removed for microservice approach
// Users are already logged in and have valid JWT tokens
// No need to check verification codes for chat access
// This matches the Instagram-like approach where logged-in users can access chat immediately

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

// WebSocket connection handling with enhanced security
wss.on('connection', (ws, req) => {
  const clientId = crypto.randomUUID();
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  // Enhanced IP validation
  if (!SecurityUtils.validateIP(clientIp)) {
    logger.warn(`Invalid IP address: ${clientIp}`);
    // ws.close(1008, 'Invalid IP address');
    // return;
  }
  
  // Check connection limits with enhanced rate limiting
  if (!checkConnectionLimit(clientIp)) {
    logger.warn(`Connection limit exceeded for IP: ${clientIp}`);
    // ws.close(1008, 'Connection limit exceeded');
    // return;
  }
  
  // Check IP-based rate limiting
  if (!rateLimiter.checkIPRateLimit(clientIp)) {
    logger.warn(`Rate limit exceeded for IP: ${clientIp}`);
    // ws.close(1008, 'Rate limit exceeded');
    // return;
  }
  
  logger.info(`New WebSocket connection: ${clientId} from ${clientIp}`);
  metrics.connections++;
  
  // Store initial client information with IP
  clients.set(clientId, {
    ws,
    clientIp,
    lastActivity: Date.now()
  });
  
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
      
      // Enhanced JSON parsing with graceful error handling
      let message;
      try {
        message = JSON.parse(data);
      } catch (jsonError) {
        logger.warn(`Malformed JSON received from client ${clientId}: ${jsonError.message}`);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid JSON format. Please check your message structure.',
          details: 'The message must be valid JSON with proper syntax.'
        }));
        return;
      }
      
      metrics.messagesReceived++;
      
      // Update client activity
      const client = clients.get(clientId);
      if (client) {
        client.lastActivity = Date.now();
        client.messageCount = (client.messageCount || 0) + 1;
      }
      
      // Enhanced input validation with specific error messages
      if (message.type === 'send_private_message') {
        const validation = InputValidator.validateMessage(message);
        if (!validation.isValid) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Missing required fields',
            details: validation.errors.join('; '),
            field: validation.field || 'general'
          }));
          return;
        }
        // Use sanitized content
        message.content = validation.sanitizedContent;
      }
      
        // Check message rate limiting for authenticated users (more lenient for large messages)
  if (client && client.user) {
    const messageLength = message.content ? message.content.length : 0;
    const rateLimitThreshold = messageLength > 500 ? MESSAGE_RATE_LIMIT * 2 : MESSAGE_RATE_LIMIT;
    
    if (!rateLimiter.checkMessageRateLimit(client.user.userId, rateLimitThreshold)) {
      metrics.rateLimitHits = (metrics.rateLimitHits || 0) + 1;
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Rate limit exceeded',
        details: 'You are sending messages too quickly. Please wait a moment before sending another message.',
        retryAfter: 30
      }));
      return;
    }
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
        message: 'Internal server error',
        details: 'An unexpected error occurred while processing your request.',
        errorId: crypto.randomUUID()
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
    
    // Remove user from online users
    if (client && client.user) {
      userConnections.delete(client.user.userId);
      sessions.delete(client.user.userId);
      
      // Notify other users that this user went offline
      broadcastToAll({
        type: 'user_offline',
        user: {
          id: client.user.userId,
          username: client.user.username
        },
        timestamp: new Date().toISOString()
      }, clientId);
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
      
    case 'get_online_users':
      await handleGetOnlineUsers(ws, data, clientId);
      break;
      
    case 'start_conversation':
      await handleStartConversation(ws, data, clientId);
      break;
      
    case 'send_private_message':
      await handleSendPrivateMessage(ws, data, clientId);
      break;
      
    case 'mark_message_read':
      await handleMarkMessageRead(ws, data, clientId);
      break;
      
    case 'edit_message':
      await handleEditMessage(ws, data, clientId);
      break;
      
    case 'delete_message':
      await handleDeleteMessage(ws, data, clientId);
      break;
      
    case 'add_reaction':
      await handleAddReaction(ws, data, clientId);
      break;
      
    case 'remove_reaction':
      await handleRemoveReaction(ws, data, clientId);
      break;
      
    case 'initialize_chat':
      await handleInitializeChat(ws, data, clientId);
      break;
      
    case 'typing':
      await handleTyping(ws, data, clientId);
      break;
      
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
      
    default:
      logger.warn(`Unknown message type: ${type}`);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type',
        details: `The message type '${type}' is not supported. Supported types: authenticate, get_online_users, start_conversation, send_private_message, mark_message_read, typing, ping`
      }));
  }
}

async function handleAuthentication(ws, data, clientId) {
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
  const verificationResult = await verifyJWTWithBackend(token, clientIp);
  
  if (!verificationResult.valid) {
    if (client) {
      client.failedAuthAttempts = (client.failedAuthAttempts || 0) + 1;
    }
    ws.send(JSON.stringify({
      type: 'auth_error',
      message: verificationResult.error || 'Token validation failed'
    }));
    logger.warn(`Authentication failed: ${verificationResult.error}`);
    return;
  }
  
  // Check for suspicious activity
  if (client) {
    const suspiciousActivity = SecurityUtils.detectSuspiciousActivity(client);
    if (suspiciousActivity.length > 0) {
      metrics.securityWarnings = (metrics.securityWarnings || 0) + 1;
      logger.warn(`Suspicious activity detected for client ${clientId}: ${suspiciousActivity.join(', ')}`);
    }
  }
  
  // Use user data from backend verification
  const user = verificationResult.user;
  
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
  
  // Update client information with user data
  const existingClient = clients.get(clientId);
  if (existingClient) {
    existingClient.user = user;
    existingClient.lastActivity = Date.now();
  }
  
  // Store session in memory
  sessions.set(user.userId, clientId);
  userConnections.set(user.userId, clientId);
  
  metrics.activeUsers = clients.size;
  if (metrics.activeUsers > metrics.peakConcurrentUsers) {
    metrics.peakConcurrentUsers = metrics.activeUsers;
  }
  
  logger.info(`User authenticated: ${user.username} (${clientId})`);
  
  // Notify other users that this user came online
  broadcastToAll({
    type: 'user_online',
    user: {
      id: user.userId,
      username: user.username
    },
    timestamp: new Date().toISOString()
  }, clientId);
  
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

async function handleGetOnlineUsers(ws, data, clientId) {
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

async function handleStartConversation(ws, data, clientId) {
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
  const dbMessages = await loadPrivateMessagesFromDatabase(conversationId, 50);
  
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
  
  logger.info(`Conversation started between ${client.user.username} and ${recipientId}`);
}

async function handleSendPrivateMessage(ws, data, clientId) {
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
  await savePrivateMessageToDatabase(message);
  
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
    if (recipientClient && recipientClient.ws.readyState === WebSocket.OPEN) {
      // Use setTimeout to avoid race conditions with mark as read
      setTimeout(() => {
        if (recipientClient.ws.readyState === WebSocket.OPEN) {
          recipientClient.ws.send(JSON.stringify({
            type: 'new_private_message',
            message: message,
            timestamp: new Date().toISOString()
          }));
        }
      }, 100);
    }
  }
  
  logger.info(`Private message sent from ${client.user.username} to ${recipientId}`);
}

async function handleMarkMessageRead(ws, data, clientId) {
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
  if (dbConnected) {
    try {
      await dbPool.query(`
        UPDATE private_messages 
        SET is_read = true 
        WHERE message_id = $1 AND recipient_id = $2
      `, [messageId, client.user.userId]);
      
      logger.info(`Message ${messageId} marked as read by ${client.user.username}`);
    } catch (error) {
      logger.error('Error marking message as read:', error);
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
        if (senderClient && senderClient.ws.readyState === WebSocket.OPEN) {
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

async function handleTyping(ws, data, clientId) {
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
    if (recipientClient && recipientClient.ws.readyState === WebSocket.OPEN) {
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

// ============================================================================
// NEW FEATURES: Message Editing, Deletion, Reactions, and Chat Initialization
// ============================================================================

async function handleEditMessage(ws, data, clientId) {
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
      details: 'Message ID and new content are required to edit a message.'
    }));
    return;
  }
  
  // Validate content length
  if (newContent.length > 1000) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Message too long',
      details: 'Message content cannot exceed 1000 characters.'
    }));
    return;
  }
  
  // Find the message in memory
  let actualConversationId = conversationId;
  let message = null;
  
  if (!actualConversationId) {
    // Search through all conversations
    for (const [convId, conversation] of conversations.entries()) {
      message = conversation.messages.find(m => m.id === messageId);
      if (message) {
        actualConversationId = convId;
        break;
      }
    }
  } else {
    const conversation = conversations.get(actualConversationId);
    if (conversation) {
      message = conversation.messages.find(m => m.id === messageId);
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
  
  // Check if user owns the message
  if (message.senderId !== client.user.userId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Permission denied',
      details: 'You can only edit your own messages.'
    }));
    return;
  }
  
  // Check if message is too old to edit (5 minutes)
  const messageAge = Date.now() - new Date(message.timestamp).getTime();
  if (messageAge > 5 * 60 * 1000) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Message too old',
      details: 'Messages can only be edited within 5 minutes of sending.'
    }));
    return;
  }
  
  // Update message in memory
  message.content = newContent;
  message.editedAt = new Date().toISOString();
  message.isEdited = true;
  
  // Update message in database
  if (dbConnected) {
    try {
      await dbPool.query(`
        UPDATE private_messages 
        SET content = $1, edited_at = NOW(), is_edited = true
        WHERE message_id = $2 AND sender_id = $3
      `, [newContent, messageId, client.user.userId]);
      
      logger.info(`Message ${messageId} edited by ${client.user.username}`);
    } catch (error) {
      logger.error('Error editing message in database:', error);
    }
  }
  
  // Send confirmation to sender
  ws.send(JSON.stringify({
    type: 'message_edited',
    messageId: messageId,
    conversationId: actualConversationId,
    newContent: newContent,
    editedAt: message.editedAt,
    timestamp: new Date().toISOString()
  }));
  
  // Notify recipient about the edit
  const recipientClientId = userConnections.get(message.recipientId);
  if (recipientClientId) {
    const recipientClient = clients.get(recipientClientId);
    if (recipientClient && recipientClient.ws.readyState === WebSocket.OPEN) {
      recipientClient.ws.send(JSON.stringify({
        type: 'message_edited',
        messageId: messageId,
        conversationId: actualConversationId,
        newContent: newContent,
        editedAt: message.editedAt,
        timestamp: new Date().toISOString()
      }));
    }
  }
}

async function handleDeleteMessage(ws, data, clientId) {
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
      message: 'Missing message ID',
      details: 'Message ID is required to delete a message.'
    }));
    return;
  }
  
  // Find the message
  let actualConversationId = conversationId;
  let message = null;
  
  if (!actualConversationId) {
    for (const [convId, conversation] of conversations.entries()) {
      message = conversation.messages.find(m => m.id === messageId);
      if (message) {
        actualConversationId = convId;
        break;
      }
    }
  } else {
    const conversation = conversations.get(actualConversationId);
    if (conversation) {
      message = conversation.messages.find(m => m.id === messageId);
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
      details: 'Only the message sender can delete for everyone.'
    }));
    return;
  }
  
  // Check time limit for delete for everyone (1 hour)
  if (deleteForEveryone) {
    const messageAge = Date.now() - new Date(message.timestamp).getTime();
    if (messageAge > 60 * 60 * 1000) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Message too old',
        details: 'Messages can only be deleted for everyone within 1 hour of sending.'
      }));
      return;
    }
  }
  
  // Mark message as deleted in memory
  if (deleteForEveryone) {
    message.isDeleted = true;
    message.deletedAt = new Date().toISOString();
    message.deletedForEveryone = true;
  } else {
    message.isDeletedForMe = true;
    message.deletedAt = new Date().toISOString();
  }
  
  // Update database
  if (dbConnected) {
    try {
      if (deleteForEveryone) {
        await dbPool.query(`
          UPDATE private_messages 
          SET is_deleted = true, deleted_at = NOW(), deleted_for_everyone = true
          WHERE message_id = $1
        `, [messageId]);
      } else {
        // For individual deletion, we'll track this in a separate table
        await dbPool.query(`
          INSERT INTO message_deletions (message_id, user_id, deleted_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (message_id, user_id) DO NOTHING
        `, [messageId, client.user.userId]);
      }
      
      logger.info(`Message ${messageId} ${deleteForEveryone ? 'deleted for everyone' : 'deleted for user'} by ${client.user.username}`);
    } catch (error) {
      logger.error('Error deleting message in database:', error);
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
  
  // Notify recipient if deleted for everyone
  if (deleteForEveryone) {
    const recipientClientId = userConnections.get(message.recipientId);
    if (recipientClientId) {
      const recipientClient = clients.get(recipientClientId);
      if (recipientClient && recipientClient.ws.readyState === WebSocket.OPEN) {
        recipientClient.ws.send(JSON.stringify({
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

async function handleAddReaction(ws, data, clientId) {
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
  
  // Find the message
  let actualConversationId = conversationId;
  let message = null;
  
  if (!actualConversationId) {
    for (const [convId, conversation] of conversations.entries()) {
      message = conversation.messages.find(m => m.id === messageId);
      if (message) {
        actualConversationId = convId;
        break;
      }
    }
  } else {
    const conversation = conversations.get(actualConversationId);
    if (conversation) {
      message = conversation.messages.find(m => m.id === messageId);
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
  
  // Save to database
  if (dbConnected) {
    try {
      await dbPool.query(`
        INSERT INTO message_reactions (message_id, user_id, reaction, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (message_id, user_id, reaction) DO NOTHING
      `, [messageId, client.user.userId, reaction]);
      
      logger.info(`Reaction ${reaction} added to message ${messageId} by ${client.user.username}`);
    } catch (error) {
      logger.error('Error adding reaction to database:', error);
    }
  }
  
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
      if (senderClient && senderClient.ws.readyState === WebSocket.OPEN) {
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

async function handleRemoveReaction(ws, data, clientId) {
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
  
  // Find the message
  let actualConversationId = conversationId;
  let message = null;
  
  if (!actualConversationId) {
    for (const [convId, conversation] of conversations.entries()) {
      message = conversation.messages.find(m => m.id === messageId);
      if (message) {
        actualConversationId = convId;
        break;
      }
    }
  } else {
    const conversation = conversations.get(actualConversationId);
    if (conversation) {
      message = conversation.messages.find(m => m.id === messageId);
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
  
  // Remove from database
  if (dbConnected) {
    try {
      await dbPool.query(`
        DELETE FROM message_reactions 
        WHERE message_id = $1 AND user_id = $2 AND reaction = $3
      `, [messageId, client.user.userId, reaction]);
      
      logger.info(`Reaction ${reaction} removed from message ${messageId} by ${client.user.username}`);
    } catch (error) {
      logger.error('Error removing reaction from database:', error);
    }
  }
  
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
      if (senderClient && senderClient.ws.readyState === WebSocket.OPEN) {
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

async function handleInitializeChat(ws, data, clientId) {
  const client = clients.get(clientId);
  if (!client || !client.user) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Authentication required',
      details: 'You must be authenticated to initialize a chat.'
    }));
    return;
  }
  
  const { recipientId } = data;
  
  if (!recipientId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Missing recipient ID',
      details: 'Recipient ID is required to initialize a chat.'
    }));
    return;
  }
  
  // Validate recipient ID
  if (recipientId === client.user.userId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Invalid recipient',
      details: 'You cannot start a chat with yourself.'
    }));
    return;
  }
  
  // Generate unique conversation ID
  const conversationId = crypto.randomUUID();
  
  // Create new conversation
  const conversation = {
    id: conversationId,
    participants: [client.user.userId, recipientId],
    messages: [],
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };
  
  // Store conversation in memory
  conversations.set(conversationId, conversation);
  
  // Store conversation in database
  if (dbConnected) {
    try {
      await dbPool.query(`
        INSERT INTO conversations (conversation_id, participant1_id, participant2_id, created_at, last_activity)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (conversation_id) DO NOTHING
      `, [conversationId, client.user.userId, recipientId]);
      
      logger.info(`New chat initialized between ${client.user.username} and user ${recipientId}`);
    } catch (error) {
      logger.error('Error initializing chat in database:', error);
    }
  }
  
  // Send confirmation to sender
  ws.send(JSON.stringify({
    type: 'chat_initialized',
    conversationId: conversationId,
    recipientId: recipientId,
    timestamp: new Date().toISOString()
  }));
  
  // Notify recipient if online
  const recipientClientId = userConnections.get(recipientId);
  if (recipientClientId) {
    const recipientClient = clients.get(recipientClientId);
    if (recipientClient && recipientClient.ws.readyState === WebSocket.OPEN) {
      recipientClient.ws.send(JSON.stringify({
        type: 'new_chat_initialized',
        conversationId: conversationId,
        initiatorId: client.user.userId,
        initiatorUsername: client.user.username,
        timestamp: new Date().toISOString()
      }));
    }
  }
}

function broadcastToAll(message, excludeClientId = null) {
  const messageStr = JSON.stringify(message);
  const messageSize = Buffer.byteLength(messageStr);
  
  clients.forEach((client, clientId) => {
    if (clientId === excludeClientId) return;
    
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

// Set up periodic cleanup
setInterval(() => {
  rateLimiter.cleanup();
}, 60000); // Clean up every minute

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  wss.clients.forEach(client => {
    client.close(1000, 'Server shutting down');
  });
  
  await dbPool.end();
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  wss.clients.forEach(client => {
    client.close(1000, 'Server shutting down');
  });
  
  await dbPool.end();
  
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
console.log('Starting enhanced private messaging server...');
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV || 'production',
  JWT_SECRET_LENGTH: JWT_SECRET.length,
  CHAT_ENCRYPTION_KEY_LENGTH: CHAT_ENCRYPTION_KEY.length,
  REDIS: 'disabled'
});

server.listen(port, async () => {
  console.log(`🚀 Enhanced private messaging server running on port ${port}`);
  logger.info(`Enhanced private messaging server running on port ${port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'production'}`);
  logger.info(`Active connections: ${wss.clients.size}`);
  logger.info(`Database pool: ${dbConnected ? 'active' : 'inactive'}`);
  logger.info(`Security: enhanced rate limiting and validation`);
  logger.info(`Health checks: available at /health, /metrics, /ready, /live`);
});

module.exports = { wss, server, metrics };

