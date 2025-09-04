// Fast Redis Mock for Development and Testing
// This provides a lightweight in-memory Redis-like interface for faster development

class RedisMock {
  constructor() {
    this.data = new Map();
    this.expiry = new Map();
    this.connected = true;
  }

  async connect() {
    this.connected = true;
    return this;
  }

  async disconnect() {
    this.connected = false;
    return 'OK';
  }

  async quit() {
    this.connected = false;
    return 'OK';
  }

  get isReady() {
    return this.connected;
  }

  async ping() {
    return 'PONG';
  }

  async get(key) {
    if (!this.connected) throw new Error('Redis mock not connected');
    
    const value = this.data.get(key);
    if (value === undefined) return null;
    
    // Check expiry
    const expiryTime = this.expiry.get(key);
    if (expiryTime && Date.now() > expiryTime) {
      this.data.delete(key);
      this.expiry.delete(key);
      return null;
    }
    
    return value;
  }

  async set(key, value) {
    if (!this.connected) throw new Error('Redis mock not connected');
    this.data.set(key, value);
    return 'OK';
  }

  async setEx(key, seconds, value) {
    if (!this.connected) throw new Error('Redis mock not connected');
    this.data.set(key, value);
    this.expiry.set(key, Date.now() + (seconds * 1000));
    return 'OK';
  }

  async del(key) {
    if (!this.connected) throw new Error('Redis mock not connected');
    const existed = this.data.has(key);
    this.data.delete(key);
    this.expiry.delete(key);
    return existed ? 1 : 0;
  }

  async exists(key) {
    if (!this.connected) throw new Error('Redis mock not connected');
    return this.data.has(key) ? 1 : 0;
  }

  async keys(pattern) {
    if (!this.connected) throw new Error('Redis mock not connected');
    const allKeys = Array.from(this.data.keys());
    if (pattern === '*') return allKeys;
    
    // Simple pattern matching for common patterns
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(key => regex.test(key));
  }

  async flushAll() {
    if (!this.connected) throw new Error('Redis mock not connected');
    this.data.clear();
    this.expiry.clear();
    return 'OK';
  }

  // Event emitters for compatibility
  on(event, callback) {
    // Mock event handling - just store the callback
    if (!this._eventHandlers) this._eventHandlers = {};
    if (!this._eventHandlers[event]) this._eventHandlers[event] = [];
    this._eventHandlers[event].push(callback);
  }

  emit(event, ...args) {
    if (this._eventHandlers && this._eventHandlers[event]) {
      this._eventHandlers[event].forEach(callback => callback(...args));
    }
  }
}

// Fast Redis Mock Factory
function createRedisMock() {
  return new RedisMock();
}

// Mock Redis client for development
let mockRedisClient = null;

async function initializeRedisMock() {
  try {
    mockRedisClient = createRedisMock();
    await mockRedisClient.connect();
    console.log('✅ Redis Mock initialized successfully (fast in-memory mode)');
    return true;
  } catch (error) {
    console.warn('Redis Mock initialization failed:', error.message);
    mockRedisClient = null;
    return false;
  }
}

function getRedisMockClient() {
  return mockRedisClient;
}

function isRedisMockConnected() {
  return mockRedisClient && mockRedisClient.isReady;
}

async function closeRedisMock() {
  if (mockRedisClient) {
    try {
      await mockRedisClient.quit();
      console.log('✅ Redis Mock connection closed gracefully');
    } catch (error) {
      console.error('Error closing Redis Mock connection:', error);
    }
  }
}

module.exports = {
  RedisMock,
  createRedisMock,
  initializeRedisMock,
  getRedisMockClient,
  isRedisMockConnected,
  closeRedisMock
};
