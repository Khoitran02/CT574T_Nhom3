import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let mongoConnection = null;

export const connectMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGO_DATABASE || 'socialnetwork';

    mongoConnection = await mongoose.createConnection(mongoUri, {
      dbName: dbName,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }).asPromise();
    
    mongoConnection.on('connected', () => {
      console.log(`MongoDB connected: ${dbName}`);
    });
    
    mongoConnection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    await testShardingStatus(mongoConnection);
    return mongoConnection;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
};

const testShardingStatus = async (connection) => {
  try {
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
      console.log(`Sharding active: ${shardStatus.shards.length} shards detected`);
    }
  } catch (error) {
    console.warn('Sharding status check failed (may be single MongoDB):', error.message);
  }
};

export const getMongoConnection = () => {
  if (!mongoConnection) {
    throw new Error('MongoDB connection chưa được khởi tạo. Gọi connectMongoDB() trước.');
  }
  return mongoConnection;
};

export const closeMongoConnection = async () => {
  try {
    if (mongoConnection) {
      await mongoConnection.close();
      console.log('MongoDB Cluster connection closed');
      mongoConnection = null;
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
};

export const testMongoConnection = async () => {
  try {
    if (!mongoConnection) {
      throw new Error('MongoDB connection not initialized');
    }

    if (mongoConnection.readyState !== 1) {
      console.log('Waiting for MongoDB connection to be ready...');
      await new Promise(resolve => {
        if (mongoConnection.readyState === 1) resolve();
        else mongoConnection.once('connected', resolve);
      });
    }

    const dbName = process.env.MONGO_DATABASE || 'socialnetwork';
    const db = mongoConnection.useDb(dbName);
    
    try {
      const client = mongoConnection.getClient?.() || mongoConnection.client;
      const adminDb = client.db('admin');
      const shardStatus = await adminDb.command({ listShards: 1 });
      console.log(`MongoDB Sharding: ${shardStatus.shards.length} shards active`);
      return {
        status: 'connected',
        type: 'sharded',
        shards: shardStatus.shards.length,
        uri: process.env.MONGO_URI || 'mongodb://localhost:27017'
      };
    } catch (error) {
      return {
        status: 'connected',
        type: 'single',
        shards: 0,
        uri: process.env.MONGO_URI || 'mongodb://localhost:27017'
      };
    }
  } catch (error) {
    console.error('MongoDB connection test failed:', error.message);
    throw error;
  }
};

export const mongoUtils = {
  /**
   * Get collection from connection
   */
  getCollection: (collectionName) => {
    const connection = getMongoConnection();
    const dbName = process.env.MONGO_DATABASE || 'socialnetwork';
    return connection.useDb(dbName).collection(collectionName);
  },

  /**
   * Check if collection is sharded
   */
  isCollectionSharded: async (collectionName) => {
    try {
      const connection = getMongoConnection();
      const dbName = process.env.MONGO_DATABASE || 'socialnetwork';
      const db = connection.useDb(dbName);
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
      const dbName = process.env.MONGO_DATABASE || 'socialnetwork';
      const db = connection.useDb(dbName);
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