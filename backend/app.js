// app.js
import express from "express";
import dotenv from "dotenv";
import {
  connectAllDatabases,
  testAllConnections,
  closeAllConnections,
} from "./config/database.js";
import routes from "./routes/index.js";
import { setDatabaseStatus } from "./routes/database-health.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Kết nối databases
const initializeDatabases = async () => {
  try {
    console.log('Initializing Social Network Database...\n');
    
    // Connect all databases
    await connectAllDatabases();
    
    // Test all connections
    const testResults = await testAllConnections();
    
    const successfulConnections = testResults.filter(r => r.status === 'connected');
    const failedConnections = testResults.filter(r => r.status === 'failed');
    
    console.log(`${successfulConnections.length}/${testResults.length} databases connected successfully`);
    
    if (failedConnections.length > 0) {
      console.warn('Some databases failed to connect:');
      failedConnections.forEach(failed => {
        console.warn(`- ${failed.database}: ${failed.error}`);
      });
    }
    
    if (successfulConnections.length === 0) {
      console.error('No databases connected. Please check configuration.');
      process.exit(1);
    }
    
    return testResults;
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  }
};

// Simple root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Social Network API Server",
    timestamp: new Date().toISOString(),
  });
});

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Initialize databases first
    console.log('Waiting for databases to initialize...\n');
    const databaseStatus = await initializeDatabases();
    
    // Share database status with health check route
    setDatabaseStatus(databaseStatus);
    
    console.log('\nMounting API routes...');
    app.use("/api", routes);
    console.log('Routes mounted successfully');
    
    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
      });
    });
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`URL: http://localhost:${PORT}`);
      console.log(`API: http://localhost:${PORT}/api\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nStopping server...");
  await closeAllConnections();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nStopping server...");
  await closeAllConnections();
  process.exit(0);
});

export default app;
