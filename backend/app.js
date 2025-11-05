// app.js
import express from "express";
import dotenv from "dotenv";
import {
  connectAllDatabases,
  testAllConnections,
  closeAllConnections,
} from "./config/database.js";
import routes from "./routes/index.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Kết nối databases
const initializeDatabases = async () => {
  try {
    console.log('🚀 Initializing Social Network Database...\n');
    
    // Connect all databases
    const connectionResults = await connectAllDatabases();
    
    // Test all connections
    const testResults = await testAllConnections();
    
    const successfulConnections = testResults.filter(r => r.status === 'connected');
    const failedConnections = testResults.filter(r => r.status === 'failed');
    
    console.log(`✅ ${successfulConnections.length}/${testResults.length} databases connected successfully`);
    
    if (failedConnections.length > 0) {
      console.warn('⚠️  Some databases failed to connect:');
      failedConnections.forEach(failed => {
        console.warn(`   - ${failed.database}: ${failed.error}`);
      });
    }
    
    if (successfulConnections.length === 0) {
      console.error('❌ No databases connected. Please check configuration.');
      process.exit(1);
    }
    
    return testResults;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
};

// Initialize databases
let databaseStatus = [];
initializeDatabases().then((results) => {
  databaseStatus = results;
});

// Routes
app.use("/api", routes);

// Health check với thông tin databases
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Social Network API Server",
    project: "CT574T - MongoDB Sharded Cluster + Neo4j",
    databases: databaseStatus.map(db => ({
      name: db.database,
      status: db.status,
      type: db.type || 'unknown',
      uri: db.uri || 'hidden',
      message: db.message,
    })),
    architecture: {
      mongodb: "Native Sharded Cluster (6 mongod + 1 mongos)",
      neo4j: "Local Graph Database",
      sharding: "Enabled with 3 shards"
    },
    timestamp: new Date().toISOString(),
  });
});

// Start server
const PORT = process.env.PORT || 3000;

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên port ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}`);
    console.log(`🧪 Neo4j Demo: http://localhost:${PORT}/api/neo4j/test`);
  });
};

// Start server after database initialization
setTimeout(() => {
  startServer();
}, 1000); // Đợi 1 giây để databases kết nối xong

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🔄 Đang dừng server...");
  await closeAllConnections();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🔄 Đang dừng server...");
  await closeAllConnections();
  process.exit(0);
});

export default app;
