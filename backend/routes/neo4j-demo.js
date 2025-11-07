// routes/neo4j-demo.js
import express from 'express';
import { getNeo4jSession } from '../config/database.js';

const router = express.Router();

router.get('/test', async (req, res) => {
  try {
    const session = getNeo4jSession();
    const result = await session.run('RETURN "Hello from Neo4j!" AS message, datetime() AS timestamp');
    const record = result.records[0];
    
    res.json({
      success: true,
      message: record.get('message'),
      timestamp: record.get('timestamp'),
      neo4j_version: result.summary.server.version
    });
    
    await session.close();
  } catch (error) {
    res.status(503).json({
      success: false,
      error: error.message,
      note: 'Neo4j chưa được cấu hình hoặc không khả dụng. Xem hướng dẫn trong NEO4J_SETUP.md'
    });
  }
});

/**
 * Tạo sample users trong Neo4j
 */
router.post('/create-sample-users', async (req, res) => {
  const session = getNeo4jSession();
  
  try {
    // Tạo users
    await session.run(`
      CREATE (u1:User {id: 1, username: 'john_doe', email: 'john@example.com', name: 'John Doe', created: datetime()})
      CREATE (u2:User {id: 2, username: 'jane_smith', email: 'jane@example.com', name: 'Jane Smith', created: datetime()})
      CREATE (u3:User {id: 3, username: 'bob_wilson', email: 'bob@example.com', name: 'Bob Wilson', created: datetime()})
      CREATE (u4:User {id: 4, username: 'alice_johnson', email: 'alice@example.com', name: 'Alice Johnson', created: datetime()})
      CREATE (u5:User {id: 5, username: 'charlie_brown', email: 'charlie@example.com', name: 'Charlie Brown', created: datetime()})
    `);

    // Tạo relationships
    await session.run(`
      MATCH (u1:User {id: 1}), (u2:User {id: 2})
      CREATE (u1)-[:FOLLOWS {since: datetime()}]->(u2)
      
      MATCH (u1:User {id: 1}), (u3:User {id: 3})
      CREATE (u1)-[:FOLLOWS {since: datetime()}]->(u3)
      
      MATCH (u2:User {id: 2}), (u1:User {id: 1})
      CREATE (u2)-[:FOLLOWS {since: datetime()}]->(u1)
      
      MATCH (u1:User {id: 1}), (u2:User {id: 2})
      CREATE (u1)-[:FRIENDS {since: datetime()}]->(u2)
    `);

    res.json({
      success: true,
      message: 'Sample users và relationships đã được tạo thành công!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    await session.close();
  }
});

/**
 * Lấy tất cả users
 */
router.get('/users', async (req, res) => {
  const session = getNeo4jSession();
  
  try {
    const result = await session.run('MATCH (u:User) RETURN u ORDER BY u.id');
    const users = result.records.map(record => record.get('u').properties);
    
    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    await session.close();
  }
});

/**
 * Lấy user relationships
 */
router.get('/users/:id/relationships', async (req, res) => {
  const session = getNeo4jSession();
  const userId = parseInt(req.params.id);
  
  try {
    const result = await session.run(`
      MATCH (u:User {id: $userId})-[r]->(other:User)
      RETURN type(r) as relationship_type, other.name as other_user, r.since as since
      ORDER BY relationship_type, other_user
    `, { userId });
    
    const relationships = result.records.map(record => ({
      type: record.get('relationship_type'),
      user: record.get('other_user'),
      since: record.get('since')
    }));
    
    res.json({
      success: true,
      user_id: userId,
      relationships: relationships
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    await session.close();
  }
});

/**
 * Xóa tất cả data (để reset)
 */
router.delete('/clear-all', async (req, res) => {
  const session = getNeo4jSession();
  
  try {
    await session.run('MATCH (n) DETACH DELETE n');
    
    res.json({
      success: true,
      message: 'Tất cả data đã được xóa khỏi Neo4j'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    await session.close();
  }
});

export default router;