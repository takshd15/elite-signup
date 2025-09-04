const os = require('os');

function setupHttpEndpoints(server, wss, dbPool, getDbConnected, metrics) {
  server.on('request', (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Set CORS headers for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
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
          connected: getDbConnected(),
          pool: {
            totalCount: dbPool.totalCount,
            idleCount: dbPool.idleCount,
            waitingCount: dbPool.waitingCount
          }
        },
        security: {
          rateLimitHits: metrics.rateLimitHits || 0,
          securityWarnings: metrics.securityWarnings || 0
        },
        performance: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          activeConnections: wss.clients.size,
          totalConnections: metrics.connections || 0,
          messagesPerSecond: metrics.messagesReceived / (process.uptime() / 60) || 0
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
          connected: getDbConnected(),
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
        ready: getDbConnected() && wss.clients.size >= 0,
        timestamp: new Date().toISOString(),
        checks: [
          { name: 'database', status: getDbConnected() ? 'healthy' : 'unhealthy' },
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
      // This would need access to userConnections and clients
      // For now, return basic info
      const userList = [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(userList));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });
}

module.exports = {
  setupHttpEndpoints
};
