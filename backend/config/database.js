import { connectMongoDB, getMongoConnection, closeMongoConnection, testMongoConnection } from './mongodb.js';
import { connectNeo4j, getNeo4jDriver, getNeo4jSession, closeNeo4jConnection, testNeo4jConnection } from './neo4j.js';
import dotenv from 'dotenv';

dotenv.config();

export const connectAllDatabases = async () => {
  console.log('Initializing all database connections...\n');
  
  const results = [];
  
  try {
    // Connect MongoDB
    console.log('1. Connecting to MongoDB Cluster...');
    await connectMongoDB();
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
  }
  
  try {
    // Connect Neo4j
    console.log('\n2. Connecting to Neo4j...');
    await connectNeo4j();
  } catch (error) {
    console.error('Neo4j connection failed:', error.message);
  }  
  return results;
};

export const closeAllConnections = async () => {
  console.log('Closing all database connections...');
  
  try {
    await closeNeo4jConnection();
  } catch (error) {
    console.error('Error closing Neo4j connection:', error);
  }
  
  try {
    await closeMongoConnection();
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
  
  console.log('All database connections closed');
};

export const testAllConnections = async () => {
  console.log('Testing all database connections...\n');
  
  const results = [];
  
  try {
    console.log('1. Testing MongoDB connection...');
    const mongoResult = await testMongoConnection();
    console.log(`MongoDB: ${mongoResult.status} (${mongoResult.type})`);
    results.push({ database: 'MongoDB', ...mongoResult });
  } catch (error) {
    console.error('MongoDB test failed:', error.message);
    results.push({ database: 'MongoDB', status: 'failed', error: error.message });
  }
  
  try {
    console.log('\n2. Testing Neo4j connection...');
    const neo4jResult = await testNeo4jConnection();
    console.log(`Neo4j: ${neo4jResult.status}`);
    results.push({ database: 'Neo4j', ...neo4jResult });
  } catch (error) {
    console.error('Neo4j test failed:', error.message);
    results.push({ database: 'Neo4j', status: 'failed', error: error.message });
  }
  
  return results;
};

export { connectMongoDB, getMongoConnection, closeMongoConnection, testMongoConnection } from './mongodb.js';
export { connectNeo4j, getNeo4jDriver, getNeo4jSession, closeNeo4jConnection, testNeo4jConnection } from './neo4j.js';

export default {
  connectAllDatabases,
  closeAllConnections,
  testAllConnections,
  
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