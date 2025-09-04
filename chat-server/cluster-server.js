const cluster = require('cluster');
const os = require('os');

// Load environment variables
require('dotenv').config();

const numCPUs = os.cpus().length;
const PORT = process.env.PORT || 3001;

if (cluster.isMaster) {
  console.log(`🚀 Starting Chat Server Cluster`);
  console.log(`📊 Master process ${process.pid} is running`);
  console.log(`💻 Detected ${numCPUs} CPU cores`);
  console.log(`🌐 Server will run on port ${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'production'}`);
  
  // Fork workers based on CPU cores (but limit to 1 for development)
  const numWorkers = process.env.NODE_ENV === 'production' ? Math.min(numCPUs, 8) : 1;
  console.log(`👥 Starting ${numWorkers} worker processes...`);
  
  for (let i = 0; i < numWorkers; i++) {
    const worker = cluster.fork();
    console.log(`✅ Worker ${worker.process.pid} started`);
  }
  
  // Handle worker exit
  cluster.on('exit', (worker, code, signal) => {
    console.log(`❌ Worker ${worker.process.pid} died`);
    if (signal) {
      console.log(`   Signal: ${signal}`);
    } else {
      console.log(`   Exit code: ${code}`);
    }
    
    // Restart worker if it didn't exit gracefully
    if (!worker.exitedAfterDisconnect) {
      console.log(`🔄 Starting a new worker...`);
      const newWorker = cluster.fork();
      console.log(`✅ New worker ${newWorker.process.pid} started`);
    }
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Master received SIGTERM, shutting down gracefully...');
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
  });
  
  process.on('SIGINT', () => {
    console.log('🛑 Master received SIGINT, shutting down gracefully...');
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
  });
  
} else {
  // Worker process - start the actual server
  console.log(`👷 Worker ${process.pid} starting server...`);
  
  // Import and start the main server
  require('./server.js');
  
  // Handle worker-specific shutdown
  process.on('SIGTERM', () => {
    console.log(`🛑 Worker ${process.pid} received SIGTERM`);
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log(`🛑 Worker ${process.pid} received SIGINT`);
    process.exit(0);
  });
}
