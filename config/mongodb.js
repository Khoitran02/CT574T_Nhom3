// config/mongodb.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB Connection (Unified for cluster)
let mongoConnection = null;

/**
 * Kết nối MongoDB Cluster (Sharded)
 * Sử dụng mongos router trên port 27017
 */
export const connectMongoDB = async () => {
  try {
    // Sử dụng môi trường development với MongoDB cluster
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    
    let mongoUri;
    if (isDev) {
      // Development: kết nối mongos router
      mongoUri = 'mongodb://localhost:27017/socialnetwork';
      console.log('🔧 Sử dụng MongoDB Development Cluster (Native)');
    } else {
      // Production: sử dụng URI từ .env
      mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/socialnetwork';
      console.log('🚀 Sử dụng MongoDB Production');
    }

    mongoConnection = await mongoose.createConnection(mongoUri, {
      dbName: 'socialnetwork',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    mongoConnection.on('connected', () => {
      console.log('✅ MongoDB Cluster connected via mongos (port 27017)');
    });
    
    mongoConnection.on('error', (err) => {
      console.error('❌ MongoDB Cluster connection error:', err);
    });
    
    // Test sharding status
    await testShardingStatus(mongoConnection);
    return mongoConnection;
  } catch (error) {
    console.error('❌ MongoDB Cluster connection failed:', error);
    throw error;
  }
};

/**
 * Test MongoDB sharding status
 */
const testShardingStatus = async (connection) => {
  try {
    // Wait for connection to be ready
    if (connection.readyState !== 1) {
      return; // Skip test if not ready
    }
    
    let admin;
    if (connection.db) {
      admin = connection.db.admin();
    } else {
      // Fallback for different connection types
      const client = connection.getClient?.() || connection.client;
      admin = client?.db('admin');
    }
    
    if (admin) {
      const shardStatus = await admin.command({ listShards: 1 });
      console.log(`✅ Sharding active: ${shardStatus.shards.length} shards detected`);
    }
  } catch (error) {
    console.warn('⚠️  Sharding status check failed (may be single MongoDB):', error.message);
  }
};

/**
 * Lấy MongoDB connection (unified)
 */
export const getMongoConnection = () => {
  if (!mongoConnection) {
    throw new Error('MongoDB connection chưa được khởi tạo. Gọi connectMongoDB() trước.');
  }
  return mongoConnection;
};

/**
 * Đóng MongoDB connection
 */
export const closeMongoConnection = async () => {
  try {
    if (mongoConnection) {
      await mongoConnection.close();
      console.log('✅ MongoDB Cluster connection closed');
      mongoConnection = null;
    }
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
};

/**
 * Test MongoDB connection và sharding
 */
export const testMongoConnection = async () => {
  try {
    if (!mongoConnection) {
      throw new Error('MongoDB connection not initialized');
    }

    // Wait for connection to be ready
    if (mongoConnection.readyState !== 1) {
      console.log('⏳ Waiting for MongoDB connection to be ready...');
      await new Promise(resolve => {
        if (mongoConnection.readyState === 1) resolve();
        else mongoConnection.once('connected', resolve);
      });
    }

    // Test ping
    let adminDb, db;
    if (mongoConnection.db) {
      adminDb = mongoConnection.db.admin();
      db = mongoConnection.useDb('socialnetwork');
    } else {
      const client = mongoConnection.getClient?.() || mongoConnection.client;
      adminDb = client.db('admin');
      db = client.db('socialnetwork');
    }

    const pingResult = await adminDb.ping();
    if (pingResult.ok !== 1) {
      throw new Error('MongoDB ping failed');
    }

    // Test sharding status
    try {
      const shardStatus = await adminDb.command({ listShards: 1 });
      console.log(`✅ MongoDB Sharding: ${shardStatus.shards.length} shards active`);
      return {
        status: 'connected',
        type: 'sharded',
        shards: shardStatus.shards.length,
        uri: 'mongodb://localhost:27017/socialnetwork'
      };
    } catch (error) {
      console.log('ℹ️  MongoDB: Single instance (no sharding)');
      return {
        status: 'connected',
        type: 'single',
        shards: 0,
        uri: 'mongodb://localhost:27017/socialnetwork'
      };
    }
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error.message);
    throw error;
  }
};

/**
 * Utility functions for MongoDB operations
 */
export const mongoUtils = {
  /**
   * Get collection from connection
   */
  getCollection: (collectionName) => {
    const connection = getMongoConnection();
    return connection.useDb('socialnetwork').collection(collectionName);
  },

  /**
   * Check if collection is sharded
   */
  isCollectionSharded: async (collectionName) => {
    try {
      const connection = getMongoConnection();
      const db = connection.useDb('socialnetwork');
      const shardInfo = await db.runCommand({ getShardDistribution: collectionName });
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get database stats
   */
  getDatabaseStats: async () => {
    try {
      const connection = getMongoConnection();
      const db = connection.useDb('socialnetwork');
      const stats = await db.stats();
      return stats;
    } catch (error) {
      console.error('Error getting database stats:', error);
      return null;
    }
  }
};

export default {
  connectMongoDB,
  getMongoConnection,
  closeMongoConnection,
  testMongoConnection,
  mongoUtils
};