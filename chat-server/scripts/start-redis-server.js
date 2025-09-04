#!/usr/bin/env node

// Simple Redis-compatible server for development
// This provides basic Redis functionality for local development

const net = require('net');
const EventEmitter = require('events');

class SimpleRedisServer extends EventEmitter {
  constructor(port = 6379) {
    super();
    this.port = port;
    this.data = new Map();
    this.expiry = new Map();
    this.server = null;
  }

  start() {
    this.server = net.createServer((socket) => {
      console.log('✅ Redis client connected');
      
      socket.on('data', (data) => {
        this.handleCommand(socket, data.toString().trim());
      });

      socket.on('close', () => {
        console.log('❌ Redis client disconnected');
      });

      socket.on('error', (err) => {
        console.error('Redis client error:', err.message);
      });
    });

    this.server.listen(this.port, () => {
      console.log(`🚀 Simple Redis Server running on port ${this.port}`);
      console.log('📝 Supported commands: PING, SET, GET, SETEX, DEL, EXISTS, KEYS, FLUSHALL');
    });

    this.server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${this.port} is already in use. Redis server may already be running.`);
      } else {
        console.error('Redis server error:', err.message);
      }
    });
  }

  stop() {
    if (this.server) {
      this.server.close(() => {
        console.log('✅ Redis server stopped');
      });
    }
  }

  handleCommand(socket, command) {
    const parts = command.split('\r\n').filter(part => part && !part.startsWith('*') && !part.startsWith('$'));
    
    if (parts.length === 0) return;

    const cmd = parts[0].toUpperCase();
    
    try {
      switch (cmd) {
        case 'PING':
          this.sendResponse(socket, 'PONG');
          break;
          
        case 'SET':
          if (parts.length >= 3) {
            this.data.set(parts[1], parts[2]);
            this.sendResponse(socket, 'OK');
          } else {
            this.sendError(socket, 'ERR wrong number of arguments for SET command');
          }
          break;
          
        case 'GET':
          if (parts.length >= 2) {
            const value = this.data.get(parts[1]);
            if (value === undefined) {
              this.sendResponse(socket, null);
            } else {
              this.sendResponse(socket, value);
            }
          } else {
            this.sendError(socket, 'ERR wrong number of arguments for GET command');
          }
          break;
          
        case 'SETEX':
          if (parts.length >= 4) {
            const key = parts[1];
            const seconds = parseInt(parts[2]);
            const value = parts[3];
            this.data.set(key, value);
            this.expiry.set(key, Date.now() + (seconds * 1000));
            this.sendResponse(socket, 'OK');
          } else {
            this.sendError(socket, 'ERR wrong number of arguments for SETEX command');
          }
          break;
          
        case 'DEL':
          if (parts.length >= 2) {
            const key = parts[1];
            const existed = this.data.has(key);
            this.data.delete(key);
            this.expiry.delete(key);
            this.sendResponse(socket, existed ? 1 : 0);
          } else {
            this.sendError(socket, 'ERR wrong number of arguments for DEL command');
          }
          break;
          
        case 'EXISTS':
          if (parts.length >= 2) {
            const key = parts[1];
            const exists = this.data.has(key);
            this.sendResponse(socket, exists ? 1 : 0);
          } else {
            this.sendError(socket, 'ERR wrong number of arguments for EXISTS command');
          }
          break;
          
        case 'KEYS':
          if (parts.length >= 2) {
            const pattern = parts[1];
            const keys = Array.from(this.data.keys());
            if (pattern === '*') {
              this.sendArrayResponse(socket, keys);
            } else {
              const regex = new RegExp(pattern.replace(/\*/g, '.*'));
              const matchingKeys = keys.filter(key => regex.test(key));
              this.sendArrayResponse(socket, matchingKeys);
            }
          } else {
            this.sendError(socket, 'ERR wrong number of arguments for KEYS command');
          }
          break;
          
        case 'FLUSHALL':
          this.data.clear();
          this.expiry.clear();
          this.sendResponse(socket, 'OK');
          break;
          
        default:
          this.sendError(socket, `ERR unknown command '${cmd}'`);
      }
    } catch (error) {
      this.sendError(socket, `ERR ${error.message}`);
    }
  }

  sendResponse(socket, value) {
    if (value === null) {
      socket.write('$-1\r\n');
    } else if (typeof value === 'string') {
      socket.write(`$${value.length}\r\n${value}\r\n`);
    } else if (typeof value === 'number') {
      socket.write(`:${value}\r\n`);
    } else {
      socket.write(`+${value}\r\n`);
    }
  }

  sendArrayResponse(socket, array) {
    socket.write(`*${array.length}\r\n`);
    array.forEach(item => {
      this.sendResponse(socket, item);
    });
  }

  sendError(socket, message) {
    socket.write(`-${message}\r\n`);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const port = process.env.REDIS_PORT || 6379;
  const server = new SimpleRedisServer(port);
  
  server.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Redis server...');
    server.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down Redis server...');
    server.stop();
    process.exit(0);
  });
}

module.exports = SimpleRedisServer;
