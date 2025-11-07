import express from "express";
import { getNeo4jSession } from "../config/database.js";

const router = express.Router();

// Follow user - POST /api/relationships/follow
router.post("/follow", async (req, res) => {
  try {
    const { followerId, followeeId } = req.body;

    if (!followerId || !followeeId) {
      return res.status(400).json({
        message: "followerId và followeeId là bắt buộc",
      });
    }

    const session = getNeo4jSession();

    // Tạo relationship FOLLOWS
    const result = await session.run(
      `MATCH (follower:User {id: $followerId}), (followee:User {id: $followeeId})
       MERGE (follower)-[r:FOLLOWS {since: datetime()}]->(followee)
       RETURN r`,
      { followerId, followeeId }
    );

    await session.close();

    if (result.records.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy user để follow",
      });
    }

    res.status(200).json({
      message: "Follow thành công",
      data: {
        followerId,
        followeeId,
        since: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi follow user", 
      error: error.message 
    });
  }
});

// Unfollow user - POST /api/relationships/unfollow
router.post("/unfollow", async (req, res) => {
  try {
    const { followerId, followeeId } = req.body;

    if (!followerId || !followeeId) {
      return res.status(400).json({
        message: "followerId và followeeId là bắt buộc",
      });
    }

    const session = getNeo4jSession();

    // Xóa relationship FOLLOWS
    const result = await session.run(
      `MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(followee:User {id: $followeeId})
       DELETE r
       RETURN count(r) as deleted`,
      { followerId, followeeId }
    );

    await session.close();

    const deleted = result.records[0]?.get('deleted')?.toNumber() || 0;

    if (deleted === 0) {
      return res.status(404).json({
        message: "Relationship không tồn tại",
      });
    }

    res.status(200).json({
      message: "Unfollow thành công",
      data: {
        followerId,
        followeeId,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi unfollow user", 
      error: error.message 
    });
  }
});

// Lấy danh sách followers của user - GET /api/relationships/followers/:userId
router.get("/followers/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const session = getNeo4jSession();

    const result = await session.run(
      `MATCH (follower:User)-[r:FOLLOWS]->(user:User {id: $userId})
       RETURN follower, r.since as since
       ORDER BY r.since DESC`,
      { userId }
    );

    await session.close();

    const followers = result.records.map(record => ({
      user: record.get('follower').properties,
      since: record.get('since'),
    }));

    res.status(200).json({
      message: "Lấy danh sách followers thành công",
      data: followers,
      total: followers.length,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi lấy followers", 
      error: error.message 
    });
  }
});

// Lấy danh sách following của user - GET /api/relationships/following/:userId
router.get("/following/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const session = getNeo4jSession();

    const result = await session.run(
      `MATCH (user:User {id: $userId})-[r:FOLLOWS]->(following:User)
       RETURN following, r.since as since
       ORDER BY r.since DESC`,
      { userId }
    );

    await session.close();

    const following = result.records.map(record => ({
      user: record.get('following').properties,
      since: record.get('since'),
    }));

    res.status(200).json({
      message: "Lấy danh sách following thành công",
      data: following,
      total: following.length,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi lấy following", 
      error: error.message 
    });
  }
});

// Check follow status - GET /api/relationships/check/:followerId/:followeeId
router.get("/check/:followerId/:followeeId", async (req, res) => {
  try {
    const { followerId, followeeId } = req.params;
    const session = getNeo4jSession();

    const result = await session.run(
      `MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(followee:User {id: $followeeId})
       RETURN r`,
      { followerId, followeeId }
    );

    await session.close();

    const isFollowing = result.records.length > 0;

    res.status(200).json({
      message: "Kiểm tra follow status thành công",
      data: {
        isFollowing,
        followerId,
        followeeId,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi kiểm tra follow status", 
      error: error.message 
    });
  }
});

// Get mutual friends - GET /api/relationships/mutual/:userId1/:userId2
router.get("/mutual/:userId1/:userId2", async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const session = getNeo4jSession();

    const result = await session.run(
      `MATCH (u1:User {id: $userId1})-[:FOLLOWS]->(mutual:User)<-[:FOLLOWS]-(u2:User {id: $userId2})
       RETURN mutual
       ORDER BY mutual.name`,
      { userId1, userId2 }
    );

    await session.close();

    const mutualFriends = result.records.map(record => record.get('mutual').properties);

    res.status(200).json({
      message: "Lấy mutual friends thành công",
      data: mutualFriends,
      total: mutualFriends.length,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi lấy mutual friends", 
      error: error.message 
    });
  }
});

// Get user stats - GET /api/relationships/stats/:userId
router.get("/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const session = getNeo4jSession();

    const result = await session.run(
      `MATCH (u:User {id: $userId})
       OPTIONAL MATCH (u)-[:FOLLOWS]->(following)
       OPTIONAL MATCH (u)<-[:FOLLOWS]-(follower)
       RETURN count(DISTINCT following) as followingCount,
              count(DISTINCT follower) as followerCount`,
      { userId }
    );

    await session.close();

    const record = result.records[0];
    const stats = {
      followers: record?.get('followerCount')?.toNumber() || 0,
      following: record?.get('followingCount')?.toNumber() || 0,
    };

    res.status(200).json({
      message: "Lấy user stats thành công",
      data: stats,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi lấy user stats", 
      error: error.message 
    });
  }
});

// Lấy network graph data (for visualization) - GET /api/relationships/network
router.get("/network", async (req, res) => {
  try {
    const session = getNeo4jSession();

    // Lấy tất cả users và relationships
    const result = await session.run(
      `MATCH (u:User)
       OPTIONAL MATCH (u)-[r:FOLLOWS]->(other:User)
       RETURN u, collect({target: other, relationship: r}) as relationships`
    );

    await session.close();

    const networkData = {
      nodes: [],
      links: []
    };

    const processedUsers = new Set();

    result.records.forEach(record => {
      const user = record.get('u').properties;
      const relationships = record.get('relationships');

      // Add user node if not already added
      if (!processedUsers.has(user.id)) {
        networkData.nodes.push({
          id: user.id,
          name: user.name,
          username: user.username,
        });
        processedUsers.add(user.id);
      }

      // Add relationships as links
      relationships.forEach(rel => {
        if (rel.target) {
          const target = rel.target.properties;
          
          // Add target node if not already added
          if (!processedUsers.has(target.id)) {
            networkData.nodes.push({
              id: target.id,
              name: target.name,
              username: target.username,
            });
            processedUsers.add(target.id);
          }

          // Add link
          networkData.links.push({
            source: user.id,
            target: target.id,
            type: 'FOLLOWS',
            since: rel.relationship?.properties?.since,
          });
        }
      });
    });

    res.status(200).json({
      message: "Lấy network data thành công",
      data: networkData,
      stats: {
        nodes: networkData.nodes.length,
        links: networkData.links.length,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi lấy network data", 
      error: error.message 
    });
  }
});

export default router;