// config/database.js
// Main database coordinator - imports and orchestrates MongoDB and Neo4j modules
import { connectMongoDB, getMongoConnection, closeMongoConnection, testMongoConnection } from './mongodb.js';
import { connectNeo4j, getNeo4jDriver, getNeo4jSession, closeNeo4jConnection, testNeo4jConnection } from './neo4j.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Kết nối tất cả databases
 */
export const connectAllDatabases = async () => {
  console.log('🔄 Initializing all database connections...\n');
  
  const results = [];
  
  try {
    // Connect MongoDB
    console.log('1️⃣ Connecting to MongoDB Cluster...');
    const mongoConn = await connectMongoDB();
    results.push({ database: 'MongoDB', status: 'connected', connection: mongoConn });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    results.push({ database: 'MongoDB', status: 'failed', error: error.message });
  }
  
  try {
    // Connect Neo4j
    console.log('\n2️⃣ Connecting to Neo4j...');
    const neo4jDriver = await connectNeo4j();
    results.push({ database: 'Neo4j', status: 'connected', connection: neo4jDriver });
  } catch (error) {
    console.error('❌ Neo4j connection failed:', error.message);
    results.push({ database: 'Neo4j', status: 'failed', error: error.message });
  }
  
  // Summary
  console.log('\n📊 Database Connection Summary:');
  results.forEach(result => {
    const status = result.status === 'connected' ? '✅' : '❌';
    console.log(`   ${status} ${result.database}: ${result.status}`);
  });
  
  const failedConnections = results.filter(r => r.status === 'failed');
  if (failedConnections.length > 0) {
    console.log('\n⚠️  Some databases failed to connect. Check logs above for details.');
  } else {
    console.log('\n🎉 All databases connected successfully!');
  }
  
  return results;
};

/**
 * Đóng tất cả kết nối databases
 */
export const closeAllConnections = async () => {
  console.log('🔄 Closing all database connections...');
  
  try {
    await closeNeo4jConnection();
  } catch (error) {
    console.error('❌ Error closing Neo4j connection:', error);
  }
  
  try {
    await closeMongoConnection();
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
  
  console.log('✅ All database connections closed');
};

/**
 * Test tất cả database connections
 */
export const testAllConnections = async () => {
  console.log('🔄 Testing all database connections...\n');
  
  const results = [];
  
  try {
    console.log('1️⃣ Testing MongoDB connection...');
    const mongoResult = await testMongoConnection();
    console.log(`   ✅ MongoDB: ${mongoResult.status} (${mongoResult.type})`);
    results.push({ database: 'MongoDB', ...mongoResult });
  } catch (error) {
    console.error('   ❌ MongoDB test failed:', error.message);
    results.push({ database: 'MongoDB', status: 'failed', error: error.message });
  }
  
  try {
    console.log('\n2️⃣ Testing Neo4j connection...');
    const neo4jResult = await testNeo4jConnection();
    console.log(`   ✅ Neo4j: ${neo4jResult.status}`);
    results.push({ database: 'Neo4j', ...neo4jResult });
  } catch (error) {
    console.error('   ❌ Neo4j test failed:', error.message);
    results.push({ database: 'Neo4j', status: 'failed', error: error.message });
  }
  
  // Summary
  console.log('\n📊 Connection Test Summary:');
  results.forEach(result => {
    const status = result.status === 'connected' ? '✅' : '❌';
    console.log(`   ${status} ${result.database}: ${result.status}`);
    if (result.type) console.log(`      Type: ${result.type}`);
    if (result.shards !== undefined) console.log(`      Shards: ${result.shards}`);
  });
  
  return results;
};

// Re-export individual modules for direct use
export { connectMongoDB, getMongoConnection, closeMongoConnection, testMongoConnection } from './mongodb.js';
export { connectNeo4j, getNeo4jDriver, getNeo4jSession, closeNeo4jConnection, testNeo4jConnection } from './neo4j.js';

export default {
  // Orchestration functions
  connectAllDatabases,
  closeAllConnections,
  testAllConnections,
  
  // Individual database functions
  connectMongoDB,
  connectNeo4j,
  getMongoConnection,
  getNeo4jDriver,
  getNeo4jSession,
  closeMongoConnection,
  closeNeo4jConnection,
  testMongoConnection,
  testNeo4jConnection
};