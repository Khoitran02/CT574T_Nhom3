# Cấu hình kết nối MongoDB + Neo4j

## Tổng quan
Hướng dẫn cấu hình kết nối giữa MongoDB Sharded Cluster và Neo4j trong ứng dụng Node.js.

## Cài đặt Dependencies

### 1. MongoDB Dependencies
```bash
npm install mongodb mongoose
```

### 2. Neo4j Dependencies  
```bash
npm install neo4j-driver
```

### 3. Utility Dependencies
```bash
npm install dotenv lodash
```

## Cấu hình Environment Variables

### .env file
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/socialnetwork
MONGODB_OPTIONS={"useNewUrlParser":true,"useUnifiedTopology":true}

# Neo4j Configuration  
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password123

# Production MongoDB (4 máy LAN)
# MONGODB_URI=mongodb://192.168.1.10:27017/socialnetwork

# Production Neo4j (máy 1)
# NEO4J_URI=bolt://192.168.1.10:7687

# Application Configuration
NODE_ENV=development
PORT=3000

# Logging
LOG_LEVEL=debug
```

## Database Connection Classes

### 1. MongoDB Connection (db/mongodb.js)
```javascript
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');

class MongoDBConnection {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      // Native MongoDB client for advanced operations
      this.client = new MongoClient(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      await this.client.connect();
      this.db = this.client.db();
      
      // Mongoose connection for ODM
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      console.log('✅ Connected to MongoDB Sharded Cluster');
      
      // Test sharding status
      await this.checkShardingStatus();
      
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  async checkShardingStatus() {
    try {
      const admin = this.db.admin();
      const shardStatus = await admin.command({ listShards: 1 });
      console.log('📊 Shards status:', shardStatus.shards.length, 'shards active');
      
      // Check if collections are sharded
      const collections = ['users', 'posts', 'comments'];
      for (const collection of collections) {
        const shardInfo = await admin.command({
          collStats: collection,
          indexDetails: true
        });
        console.log(`📋 Collection '${collection}' sharded:`, !!shardInfo.sharded);
      }
    } catch (error) {
      console.warn('⚠️ Could not check sharding status:', error.message);
    }
  }

  getDb() {
    return this.db;
  }

  getClient() {
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      await mongoose.disconnect();
      console.log('📤 Disconnected from MongoDB');
    }
  }
}

module.exports = MongoDBConnection;
```

### 2. Neo4j Connection (db/neo4j.js)
```javascript
const neo4j = require('neo4j-driver');

class Neo4jConnection {
  constructor() {
    this.driver = null;
  }

  connect() {
    try {
      this.driver = neo4j.driver(
        process.env.NEO4J_URI,
        neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD),
        {
          // Connection pool configuration
          maxConnectionPoolSize: 50,
          maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
          connectionTimeout: 20 * 1000, // 20 seconds
          
          // Logging
          logging: {
            level: process.env.LOG_LEVEL || 'info',
            logger: (level, message) => console.log(`[Neo4j ${level}] ${message}`)
          }
        }
      );

      console.log('✅ Connected to Neo4j');
      
      // Verify connection
      this.verifyConnection();
      
      return this.driver;
    } catch (error) {
      console.error('❌ Neo4j connection failed:', error);
      throw error;
    }
  }

  async verifyConnection() {
    const session = this.getSession();
    try {
      const result = await session.run('RETURN "Connection successful" AS message');
      console.log('🔗 Neo4j connection verified:', result.records[0].get('message'));
    } catch (error) {
      console.error('❌ Neo4j connection verification failed:', error);
    } finally {
      await session.close();
    }
  }

  getSession(accessMode = neo4j.session.READ) {
    if (!this.driver) {
      throw new Error('Neo4j driver not connected');
    }
    return this.driver.session({ defaultAccessMode: accessMode });
  }

  getDriver() {
    return this.driver;
  }

  async disconnect() {
    if (this.driver) {
      await this.driver.close();
      console.log('📤 Disconnected from Neo4j');
    }
  }
}

module.exports = Neo4jConnection;
```

### 3. Database Manager (db/index.js)
```javascript
const MongoDBConnection = require('./mongodb');
const Neo4jConnection = require('./neo4j');

class DatabaseManager {
  constructor() {
    this.mongodb = new MongoDBConnection();
    this.neo4j = new Neo4jConnection();
  }

  async connect() {
    try {
      // Connect to both databases
      await Promise.all([
        this.mongodb.connect(),
        this.neo4j.connect()
      ]);
      
      console.log('🚀 All database connections established');
      
      // Initialize schemas and constraints
      await this.initializeSchemas();
      
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      await this.disconnect();
      throw error;
    }
  }

  async initializeSchemas() {
    try {
      // MongoDB: Ensure indexes exist
      const db = this.mongodb.getDb();
      
      // Users collection indexes
      await db.collection('users').createIndexes([
        { key: { user_id: 1 }, unique: true },
        { key: { username: 1 }, unique: true },
        { key: { email: 1 }, unique: true }
      ]);
      
      // Posts collection indexes
      await db.collection('posts').createIndexes([
        { key: { post_id: 1 }, unique: true },
        { key: { user_id: 1 } },
        { key: { created_at: -1 } }
      ]);
      
      // Comments collection indexes
      await db.collection('comments').createIndexes([
        { key: { comment_id: 1 }, unique: true },
        { key: { post_id: 1 } },
        { key: { user_id: 1 } }
      ]);

      // Neo4j: Ensure constraints exist
      const session = this.neo4j.getSession(neo4j.session.WRITE);
      
      try {
        // User constraints
        await session.run(`
          CREATE CONSTRAINT user_id_unique IF NOT EXISTS
          FOR (u:User) REQUIRE u.id IS UNIQUE
        `);
        
        // User indexes
        await session.run(`
          CREATE INDEX user_username_index IF NOT EXISTS
          FOR (u:User) ON (u.username)
        `);
        
        await session.run(`
          CREATE INDEX user_email_index IF NOT EXISTS
          FOR (u:User) ON (u.email)
        `);
        
        console.log('📋 Database schemas initialized');
        
      } finally {
        await session.close();
      }
      
    } catch (error) {
      console.error('⚠️ Schema initialization warning:', error);
    }
  }

  getMongoDB() {
    return this.mongodb;
  }

  getNeo4j() {
    return this.neo4j;
  }

  async disconnect() {
    await Promise.all([
      this.mongodb.disconnect(),
      this.neo4j.disconnect()
    ]);
    console.log('📤 All database connections closed');
  }

  // Health check method
  async healthCheck() {
    const health = {
      mongodb: false,
      neo4j: false,
      timestamp: new Date().toISOString()
    };

    try {
      // Check MongoDB
      const db = this.mongodb.getDb();
      await db.admin().ping();
      health.mongodb = true;
    } catch (error) {
      console.error('MongoDB health check failed:', error);
    }

    try {
      // Check Neo4j
      const session = this.neo4j.getSession();
      try {
        await session.run('RETURN 1');
        health.neo4j = true;
      } finally {
        await session.close();
      }
    } catch (error) {
      console.error('Neo4j health check failed:', error);
    }

    return health;
  }
}

// Singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;
```

## Usage Example trong App

### app.js
```javascript
require('dotenv').config();
const express = require('express');
const dbManager = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await dbManager.healthCheck();
    const status = health.mongodb && health.neo4j ? 200 : 503;
    res.status(status).json(health);
  } catch (error) {
    res.status(503).json({ error: 'Health check failed' });
  }
});

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/relationships', require('./routes/relationships'));

// Start server
async function startServer() {
  try {
    // Connect to databases
    await dbManager.connect();
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🌐 Server running on http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n📤 Shutting down gracefully...');
  await dbManager.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n📤 Shutting down gracefully...');
  await dbManager.disconnect();
  process.exit(0);
});

startServer();

module.exports = app;
```

## Connection Testing

### Test script (test/connection-test.js)
```javascript
require('dotenv').config();
const dbManager = require('../db');

async function testConnections() {
  try {
    console.log('🧪 Testing database connections...');
    
    // Connect
    await dbManager.connect();
    
    // Test MongoDB
    console.log('\n📊 Testing MongoDB Sharded Cluster...');
    const mongodb = dbManager.getMongoDB();
    const db = mongodb.getDb();
    
    // Insert test document
    const testUser = {
      user_id: 999,
      username: 'test_user',
      email: 'test@example.com',
      created_at: new Date()
    };
    
    await db.collection('users').insertOne(testUser);
    console.log('✅ MongoDB write test successful');
    
    // Read test
    const found = await db.collection('users').findOne({ user_id: 999 });
    console.log('✅ MongoDB read test successful:', found.username);
    
    // Clean up
    await db.collection('users').deleteOne({ user_id: 999 });
    
    // Test Neo4j
    console.log('\n🔗 Testing Neo4j Graph Database...');
    const neo4j = dbManager.getNeo4j();
    const session = neo4j.getSession();
    
    try {
      // Create test node
      await session.run(`
        CREATE (u:TestUser {id: 999, name: 'Test User'})
        RETURN u
      `);
      console.log('✅ Neo4j write test successful');
      
      // Read test
      const result = await session.run(`
        MATCH (u:TestUser {id: 999})
        RETURN u.name as name
      `);
      
      if (result.records.length > 0) {
        console.log('✅ Neo4j read test successful:', result.records[0].get('name'));
      }
      
      // Clean up
      await session.run(`
        MATCH (u:TestUser {id: 999})
        DELETE u
      `);
      
    } finally {
      await session.close();
    }
    
    // Health check
    console.log('\n🏥 Health check...');
    const health = await dbManager.healthCheck();
    console.log('Health status:', health);
    
    console.log('\n🎉 All tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await dbManager.disconnect();
  }
}

// Run tests
testConnections();
```

## Environment-specific Configurations

### Development (Docker Local)
```env
MONGODB_URI=mongodb://localhost:27017/socialnetwork
NEO4J_URI=bolt://localhost:7687
```

### Production (4 máy LAN)
```env
MONGODB_URI=mongodb://192.168.1.10:27017/socialnetwork
NEO4J_URI=bolt://192.168.1.10:7687
```

## Monitoring và Logging

### Connection monitoring
```javascript
// Add to db/index.js
setInterval(async () => {
  const health = await dbManager.healthCheck();
  if (!health.mongodb || !health.neo4j) {
    console.error('⚠️ Database health check failed:', health);
  }
}, 60000); // Check every minute
```

Cấu hình này cung cấp:
- ✅ Kết nối ổn định đến cả MongoDB và Neo4j
- 🔄 Auto-reconnection và error handling
- 🏥 Health monitoring
- 📊 Performance optimization
- 🧪 Connection testing utilities