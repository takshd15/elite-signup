// Redis configuration for caching and session management
const redis = require('redis');
const { 
  initializeRedisMock, 
  getRedisMockClient, 
  isRedisMockConnected, 
  closeRedisMock 
} = require('./redisMock');

// Redis client configuration factory
function createRedisConfig() {
  const redisUrl = process.env.REDIS_URL || process.env.REDISCLOUD_URL || process.env.REDISTOGO_URL;
  
  return {
    url: redisUrl,
    socket: {
      connectTimeout: 500,         // Reduced from 2000ms to 500ms for faster fallback
      lazyConnect: true,
      reconnectStrategy: (retries) => {
        if (retries > 2) {         // Reduced from 3 to 2 retries
          console.warn('Redis connection failed after 2 retries, continuing without Redis');
          return false;            // Stop retrying, don't throw error
        }
        return Math.min(retries * 50, 200); // Faster retry: 50ms, 100ms, 200ms
      }
    },
    retryDelayOnFailover: 25,      // Reduced from 50ms
    enableReadyCheck: false,
    maxRetriesPerRequest: 1        // Keep at 1
  };
}

// Create Redis client
let redisClient = null;

async function initializeRedis() {
  // Check for Redis URL from various Heroku addons
  const redisUrl = process.env.REDIS_URL || process.env.REDISCLOUD_URL || process.env.REDISTOGO_URL;
  
  // Skip Redis if no URL is provided or if it's commented out
  if (!redisUrl || redisUrl.trim() === '' || redisUrl.startsWith('#')) {
    console.log('ℹ️  Redis URL not provided or disabled, running in database-only mode');
    return false;
  }
  
  try {
    const redisConfig = createRedisConfig();
    redisClient = redis.createClient(redisConfig);
    
    redisClient.on('error', (err) => {
      console.warn('Redis Client Error:', err.message);
    });
    
    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });
    
    redisClient.on('ready', () => {
      console.log('✅ Redis ready for operations');
    });
    
    redisClient.on('end', () => {
      console.log('❌ Redis connection ended');
    });
    
    // Connect to Redis
    await redisClient.connect();
    
    // Test the connection
    await redisClient.ping();
    console.log('✅ Redis connection verified with PING');
    
    return true;
  } catch (error) {
    console.warn('Redis initialization failed:', error.message);
    
    // Only use Redis Mock in development, not in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('ℹ️  Falling back to Redis Mock for faster development');
      
      // Try to initialize Redis Mock as fallback
      const mockInitialized = await initializeRedisMock();
      if (mockInitialized) {
        redisClient = getRedisMockClient();
        return true;
      }
    } else {
      console.log('ℹ️  Production Redis connection failed, continuing in database-only mode');
    }
    
    console.log('ℹ️  Continuing in database-only mode');
    redisClient = null;
    return false;
  }
}

// Function to get Redis client
function getRedisClient() {
  return redisClient;
}

// Function to check if Redis is connected
function isRedisConnected() {
  return redisClient && redisClient.isReady;
}

// Graceful shutdown
async function closeRedis() {
  if (redisClient) {
    try {
      // Check if it's a mock client
      if (redisClient.constructor.name === 'RedisMock') {
        await closeRedisMock();
      } else {
        await redisClient.quit();
        console.log('✅ Redis connection closed gracefully');
      }
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
}

module.exports = {
  initializeRedis,
  getRedisClient,
  isRedisConnected,
  closeRedis
};
