// routes/relationships.js - Neo4j Social Network Relationships API
import { Router } from 'express';
import { getNeo4jSession } from '../config/neo4j.js';

const router = Router();

// Follow a user
router.post('/follow', async (req, res) => {
  const session = getNeo4jSession();
  
  try {
    const { followerId, followeeId } = req.body;
    
    if (!followerId || !followeeId) {
      return res.status(400).json({ 
        error: 'followerId và followeeId là bắt buộc' 
      });
    }
    
    if (followerId === followeeId) {
      return res.status(400).json({ 
        error: 'Không thể follow chính mình' 
      });
    }
    
    // Check if users exist and create follow relationship
    const result = await session.run(`
      MATCH (follower:User {user_id: $followerId})
      MATCH (followee:User {user_id: $followeeId})
      MERGE (follower)-[r:FOLLOWS]->(followee)
      ON CREATE SET r.created_at = datetime()
      RETURN follower.username as follower_name, 
             followee.username as followee_name,
             r.created_at as followed_at
    `, { followerId, followeeId });
    
    if (result.records.length === 0) {
      return res.status(404).json({ 
        error: 'Không tìm thấy user' 
      });
    }
    
    const record = result.records[0];
    res.status(200).json({
      success: true,
      message: `${record.get('follower_name')} đã follow ${record.get('followee_name')}`,
      followed_at: record.get('followed_at')
    });
    
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ 
      error: 'Lỗi server khi follow user',
      details: error.message 
    });
  } finally {
    await session.close();
  }
});

// Unfollow a user
router.post('/unfollow', async (req, res) => {
  const session = getNeo4jSession();
  
  try {
    const { followerId, followeeId } = req.body;
    
    if (!followerId || !followeeId) {
      return res.status(400).json({ 
        error: 'followerId và followeeId là bắt buộc' 
      });
    }
    
    // Remove follow relationship
    const result = await session.run(`
      MATCH (follower:User {user_id: $followerId})-[r:FOLLOWS]->(followee:User {user_id: $followeeId})
      DELETE r
      RETURN follower.username as follower_name, 
             followee.username as followee_name
    `, { followerId, followeeId });
    
    if (result.records.length === 0) {
      return res.status(404).json({ 
        error: 'Không tìm thấy mối quan hệ follow này' 
      });
    }
    
    const record = result.records[0];
    res.status(200).json({
      success: true,
      message: `${record.get('follower_name')} đã unfollow ${record.get('followee_name')}`
    });
    
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ 
      error: 'Lỗi server khi unfollow user',
      details: error.message 
    });
  } finally {
    await session.close();
  }
});

// Get followers of a user
router.get('/followers/:userId', async (req, res) => {
  const session = getNeo4jSession();
  
  try {
    const { userId } = req.params;
    
    const result = await session.run(`
      MATCH (follower:User)-[:FOLLOWS]->(user:User {user_id: $userId})
      RETURN follower.user_id as user_id,
             follower.username as username,
             follower.email as email,
             follower.full_name as full_name
      ORDER BY follower.username
    `, { userId });
    
    const followers = result.records.map(record => ({
      user_id: record.get('user_id'),
      username: record.get('username'),
      email: record.get('email'),
      full_name: record.get('full_name')
    }));
    
    res.status(200).json({
      success: true,
      count: followers.length,
      followers
    });
    
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ 
      error: 'Lỗi server khi lấy danh sách followers',
      details: error.message 
    });
  } finally {
    await session.close();
  }
});

// Get following list of a user
router.get('/following/:userId', async (req, res) => {
  const session = getNeo4jSession();
  
  try {
    const { userId } = req.params;
    
    const result = await session.run(`
      MATCH (user:User {user_id: $userId})-[:FOLLOWS]->(following:User)
      RETURN following.user_id as user_id,
             following.username as username,
             following.email as email,
             following.full_name as full_name
      ORDER BY following.username
    `, { userId });
    
    const following = result.records.map(record => ({
      user_id: record.get('user_id'),
      username: record.get('username'),
      email: record.get('email'),
      full_name: record.get('full_name')
    }));
    
    res.status(200).json({
      success: true,
      count: following.length,
      following
    });
    
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ 
      error: 'Lỗi server khi lấy danh sách following',
      details: error.message 
    });
  } finally {
    await session.close();
  }
});

// Check if user A follows user B
router.get('/check/:followerId/:followeeId', async (req, res) => {
  const session = getNeo4jSession();
  
  try {
    const { followerId, followeeId } = req.params;
    
    const result = await session.run(`
      MATCH (follower:User {user_id: $followerId})-[r:FOLLOWS]->(followee:User {user_id: $followeeId})
      RETURN r.created_at as followed_at
    `, { followerId, followeeId });
    
    const isFollowing = result.records.length > 0;
    
    res.status(200).json({
      success: true,
      isFollowing,
      followed_at: isFollowing ? result.records[0].get('followed_at') : null
    });
    
  } catch (error) {
    console.error('Check follow error:', error);
    res.status(500).json({ 
      error: 'Lỗi server khi kiểm tra follow status',
      details: error.message 
    });
  } finally {
    await session.close();
  }
});

// Get mutual friends between two users
router.get('/mutual/:userId1/:userId2', async (req, res) => {
  const session = getNeo4jSession();
  
  try {
    const { userId1, userId2 } = req.params;
    
    const result = await session.run(`
      MATCH (user1:User {user_id: $userId1})-[:FOLLOWS]->(mutual:User)<-[:FOLLOWS]-(user2:User {user_id: $userId2})
      RETURN mutual.user_id as user_id,
             mutual.username as username,
             mutual.email as email,
             mutual.full_name as full_name
      ORDER BY mutual.username
    `, { userId1, userId2 });
    
    const mutualFriends = result.records.map(record => ({
      user_id: record.get('user_id'),
      username: record.get('username'),
      email: record.get('email'),
      full_name: record.get('full_name')
    }));
    
    res.status(200).json({
      success: true,
      count: mutualFriends.length,
      mutualFriends
    });
    
  } catch (error) {
    console.error('Get mutual friends error:', error);
    res.status(500).json({ 
      error: 'Lỗi server khi lấy danh sách bạn chung',
      details: error.message 
    });
  } finally {
    await session.close();
  }
});

// Get network statistics for a user
router.get('/stats/:userId', async (req, res) => {
  const session = getNeo4jSession();
  
  try {
    const { userId } = req.params;
    
    const result = await session.run(`
      MATCH (user:User {user_id: $userId})
      OPTIONAL MATCH (user)-[:FOLLOWS]->(following:User)
      OPTIONAL MATCH (follower:User)-[:FOLLOWS]->(user)
      RETURN user.username as username,
             count(DISTINCT following) as following_count,
             count(DISTINCT follower) as followers_count
    `, { userId });
    
    if (result.records.length === 0) {
      return res.status(404).json({ 
        error: 'Không tìm thấy user' 
      });
    }
    
    const record = result.records[0];
    res.status(200).json({
      success: true,
      username: record.get('username'),
      stats: {
        following: parseInt(record.get('following_count')),
        followers: parseInt(record.get('followers_count'))
      }
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      error: 'Lỗi server khi lấy thống kê',
      details: error.message 
    });
  } finally {
    await session.close();
  }
});

export default router;