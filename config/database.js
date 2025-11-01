// config/database.js
import neo4j from 'neo4j-driver';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Neo4j Driver Instance
let neo4jDriver = null;

// MongoDB Connections
let mongoPostConnection = null;
let mongoPhotosConnection = null;

/**
 * Kết nối Neo4j Database
 * Sử dụng cấu hình từ file .env hoặc local setup
 */
export const connectNeo4j = async () => {
  try {
    // Kiểm tra xem đang sử dụng Neo4j Aura hay local setup
    const isLocal = process.env.NEO4J_LOCAL === 'true';
    const isAura = process.env.NEO4J_URI && process.env.NEO4J_URI.includes('neo4j+s://');
    
    let uri, username, password;
    
    if (isLocal) {
      // Local Neo4j Desktop configuration
      uri = 'bolt://localhost:7687';
      username = 'neo4j';
      password = 'password123'; // Theo hướng dẫn setup
      console.log('🔧 Sử dụng Neo4j Local (Desktop)');
    } else if (isAura) {
      // Neo4j Aura configuration từ .env
      uri = process.env.NEO4J_URI;
      username = process.env.NEO4J_USERNAME;
      password = process.env.NEO4J_PASSWORD;
      console.log('☁️  Sử dụng Neo4j Aura (Cloud)');
    } else {
      throw new Error('Không tìm thấy cấu hình Neo4j hợp lệ. Vui lòng kiểm tra file .env');
    }

    neo4jDriver = neo4j.driver(
      uri,
      neo4j.auth.basic(username, password),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
        encrypted: isAura ? 'ENCRYPTION_ON' : 'ENCRYPTION_OFF'
      }
    );

    // Test kết nối với session mới
    const session = isLocal ? neo4jDriver.session() : neo4jDriver.session({ database: process.env.NEO4J_DATABASE || 'neo4j' });
    const result = await session.run('RETURN "Connected to Neo4j!" AS message');
    console.log('✅ Neo4j:', result.records[0].get('message'));
    
    // Tạo constraints và indexes cơ bản nếu chưa tồn tại
    await createNeo4jConstraints(session);
    
    await session.close();
    
    return neo4jDriver;
  } catch (error) {
    console.error('❌ Neo4j connection failed:', error.message);
    throw error;
  }
};

/**
 * Tạo constraints và indexes cho Neo4j
 */
const createNeo4jConstraints = async (session) => {
  try {
    // Constraint cho User nodes
    await session.run(`
      CREATE CONSTRAINT user_id_unique IF NOT EXISTS
      FOR (u:User) REQUIRE u.id IS UNIQUE
    `);

    // Indexes cho tìm kiếm nhanh
    await session.run(`
      CREATE INDEX user_email_index IF NOT EXISTS
      FOR (u:User) ON (u.email)
    `);

    await session.run(`
      CREATE INDEX user_username_index IF NOT EXISTS  
      FOR (u:User) ON (u.username)
    `);

    console.log('✅ Neo4j constraints và indexes đã được tạo');
  } catch (error) {
    console.warn('⚠️  Warning creating Neo4j constraints:', error.message);
  }
};

/**
 * Kết nối MongoDB cho Posts
 */
export const connectMongoDBPost = async () => {
  try {
    mongoPostConnection = await mongoose.createConnection(process.env.MONGO_URI_POSTS, {
      dbName: process.env.MONGO_DB_POST,
    });
    
    mongoPostConnection.on('connected', () => {
      console.log('✅ MongoDB Posts connected');
    });
    
    mongoPostConnection.on('error', (err) => {
      console.error('❌ MongoDB Posts connection error:', err);
    });
    
    return mongoPostConnection;
  } catch (error) {
    console.error('❌ MongoDB Posts connection failed:', error);
    throw error;
  }
};

/**
 * Kết nối MongoDB cho Photos
 */
export const connectMongoDBPhotos = async () => {
  try {
    mongoPhotosConnection = await mongoose.createConnection(process.env.MONGO_URI_PHOTOS, {
      dbName: process.env.MONGO_DB_PHOTOS,
    });
    
    mongoPhotosConnection.on('connected', () => {
      console.log('✅ MongoDB Photos connected');
    });
    
    mongoPhotosConnection.on('error', (err) => {
      console.error('❌ MongoDB Photos connection error:', err);
    });
    
    return mongoPhotosConnection;
  } catch (error) {
    console.error('❌ MongoDB Photos connection failed:', error);
    throw error;
  }
};

/**
 * Lấy Neo4j driver instance
 */
export const getNeo4jDriver = () => {
  if (!neo4jDriver) {
    throw new Error('Neo4j driver chưa được khởi tạo. Gọi connectNeo4j() trước.');
  }
  return neo4jDriver;
};

/**
 * Lấy session Neo4j mới
 */
export const getNeo4jSession = (database = null) => {
  const driver = getNeo4jDriver();
  
  // Với Neo4j local, không chỉ định database name
  const isLocal = process.env.NEO4J_LOCAL === 'true';
  
  if (isLocal) {
    return driver.session(); // Sử dụng default database
  } else {
    // Cho Aura, sử dụng database từ .env
    const dbName = database || process.env.NEO4J_DATABASE || 'neo4j';
    return driver.session({ database: dbName });
  }
};

/**
 * Lấy MongoDB connections
 */
export const getMongoPostConnection = () => mongoPostConnection;
export const getMongoPhotosConnection = () => mongoPhotosConnection;

/**
 * Đóng tất cả kết nối databases
 */
export const closeAllConnections = async () => {
  try {
    if (neo4jDriver) {
      await neo4jDriver.close();
      console.log('✅ Neo4j connection closed');
    }
    
    if (mongoPostConnection) {
      await mongoPostConnection.close();
      console.log('✅ MongoDB Posts connection closed');
    }
    
    if (mongoPhotosConnection) {
      await mongoPhotosConnection.close();
      console.log('✅ MongoDB Photos connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing connections:', error);
  }
};

/**
 * Utility function để test tất cả kết nối
 */
export const testAllConnections = async () => {
  try {
    console.log('🔄 Testing all database connections...');
    
    // Test Neo4j
    const session = getNeo4jSession();
    const neo4jResult = await session.run('RETURN "Neo4j OK" AS status');
    console.log('Neo4j Status:', neo4jResult.records[0].get('status'));
    await session.close();
    
    // Test MongoDB connections sẽ được kiểm tra qua event handlers
    
    console.log('✅ All database connections tested successfully');
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
  }
};

export default {
  connectNeo4j,
  connectMongoDBPost,
  connectMongoDBPhotos,
  getNeo4jDriver,
  getNeo4jSession,
  getMongoPostConnection,
  getMongoPhotosConnection,
  closeAllConnections,
  testAllConnections
};