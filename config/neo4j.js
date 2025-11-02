// config/neo4j.js
import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

// Neo4j Driver Instance
let neo4jDriver = null;

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
 * Đóng Neo4j connection
 */
export const closeNeo4jConnection = async () => {
  try {
    if (neo4jDriver) {
      await neo4jDriver.close();
      console.log('✅ Neo4j connection closed');
      neo4jDriver = null;
    }
  } catch (error) {
    console.error('❌ Error closing Neo4j connection:', error);
  }
};

/**
 * Test Neo4j connection
 */
export const testNeo4jConnection = async () => {
  try {
    if (!neo4jDriver) {
      throw new Error('Neo4j driver not initialized');
    }

    const session = getNeo4jSession();
    
    // Test basic connectivity
    const result = await session.run('RETURN "Neo4j connection test successful!" AS message, datetime() AS timestamp');
    const message = result.records[0].get('message');
    const timestamp = result.records[0].get('timestamp').toString();
    
    // Test node creation (temporary)
    await session.run(`
      MERGE (test:TestNode {id: 'connection-test', created: datetime()})
      SET test.lastChecked = datetime()
      RETURN test
    `);
    
    // Cleanup test node
    await session.run('MATCH (test:TestNode {id: "connection-test"}) DELETE test');
    
    await session.close();
    
    console.log(`✅ Neo4j connection test: ${message}`);
    return {
      status: 'connected',
      message: message,
      timestamp: timestamp,
      uri: process.env.NEO4J_LOCAL === 'true' ? 'bolt://localhost:7687' : process.env.NEO4J_URI
    };
  } catch (error) {
    console.error('❌ Neo4j connection test failed:', error.message);
    throw error;
  }
};

/**
 * Utility functions for Neo4j operations
 */
export const neo4jUtils = {
  /**
   * Execute a Cypher query with parameters
   */
  executeQuery: async (cypher, parameters = {}) => {
    const session = getNeo4jSession();
    try {
      const result = await session.run(cypher, parameters);
      return result;
    } finally {
      await session.close();
    }
  },

  /**
   * Create a User node
   */
  createUser: async (userData) => {
    const cypher = `
      CREATE (u:User {
        id: $id,
        username: $username,
        email: $email,
        created: datetime(),
        updated: datetime()
      })
      RETURN u
    `;
    return await neo4jUtils.executeQuery(cypher, userData);
  },

  /**
   * Find user by ID
   */
  findUserById: async (userId) => {
    const cypher = 'MATCH (u:User {id: $userId}) RETURN u';
    return await neo4jUtils.executeQuery(cypher, { userId });
  },

  /**
   * Create relationship between users
   */
  createRelationship: async (fromUserId, toUserId, relationshipType, properties = {}) => {
    const cypher = `
      MATCH (from:User {id: $fromUserId}), (to:User {id: $toUserId})
      CREATE (from)-[r:${relationshipType} $properties]->(to)
      SET r.created = datetime()
      RETURN r
    `;
    return await neo4jUtils.executeQuery(cypher, { fromUserId, toUserId, properties });
  },

  /**
   * Get database statistics
   */
  getDatabaseStats: async () => {
    try {
      const nodeCountResult = await neo4jUtils.executeQuery('MATCH (n) RETURN count(n) AS nodeCount');
      const relationshipCountResult = await neo4jUtils.executeQuery('MATCH ()-[r]->() RETURN count(r) AS relationshipCount');
      
      return {
        nodeCount: nodeCountResult.records[0]?.get('nodeCount').toNumber() || 0,
        relationshipCount: relationshipCountResult.records[0]?.get('relationshipCount').toNumber() || 0
      };
    } catch (error) {
      console.error('Error getting Neo4j database stats:', error);
      return null;
    }
  }
};

export default {
  connectNeo4j,
  getNeo4jDriver,
  getNeo4jSession,
  closeNeo4jConnection,
  testNeo4jConnection,
  neo4jUtils
};