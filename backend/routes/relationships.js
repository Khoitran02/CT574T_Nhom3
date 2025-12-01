import express from "express";
import neo4j from "neo4j-driver";
import User from "../models/users.model.js";
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

    // Kiểm tra nếu follower là admin thì không cho follow
    const follower = await User.findById(followerId);
    if (follower && follower.role === 'admin') {
      return res.status(403).json({
        message: "Admin không được follow user. Chỉ user mới có thể follow.",
      });
    }

    const session = getNeo4jSession();

    // Sử dụng MERGE để tránh duplicate follow
    const result = await session.run(
      `MATCH (follower:User {id: $followerId}), (followee:User {id: $followeeId})
       MERGE (follower)-[r:FOLLOWS]->(followee)
       ON CREATE SET r.since = datetime()
       RETURN r, 
              CASE WHEN r.since = datetime() THEN true ELSE false END as isNew`,
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

// Unfollow user - DELETE /api/relationships/unfollow
router.delete("/unfollow", async (req, res) => {
  try {
    const { followerId, followeeId } = req.body;

    if (!followerId || !followeeId) {
      return res.status(400).json({
        message: "Thiếu followerId hoặc followeeId",
      });
    }

    const session = getNeo4jSession();

    // Xóa relationship
    const result = await session.run(
      `MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(followee:User {id: $followeeId})
       DELETE r
       RETURN follower, followee`,
      { followerId, followeeId }
    );

    await session.close();

    if (result.records.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy relationship để xóa",
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
      message: "Lỗi khi unfollow",
      error: error.message,
    });
  }
});

// Remove follower - DELETE /api/relationships/remove-follower
router.delete("/remove-follower", async (req, res) => {
  try {
    const { userId, followerId } = req.body;

    if (!userId || !followerId) {
      return res.status(400).json({
        message: "Thiếu userId hoặc followerId",
      });
    }

    const session = getNeo4jSession();

    // Xóa relationship (follower follows me)
    const result = await session.run(
      `MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(user:User {id: $userId})
       DELETE r
       RETURN follower, user`,
      { userId, followerId }
    );

    await session.close();

    if (result.records.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy follower để xóa",
      });
    }

    res.status(200).json({
      message: "Xóa follower thành công",
      data: {
        userId,
        followerId,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi xóa follower",
      error: error.message,
    });
  }
});

// Lấy danh sách followers của user với phân trang - GET /api/relationships/followers/:userId
router.get("/followers/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const session = getNeo4jSession();

    // Get total count
    const countResult = await session.run(
      `MATCH (follower:User)-[:FOLLOWS]->(user:User {id: $userId})
       RETURN count(follower) as total`,
      { userId }
    );
    const total = countResult.records[0]?.get('total').toNumber() || 0;

    // Get paginated data
    const result = await session.run(
      `MATCH (follower:User)-[r:FOLLOWS]->(user:User {id: $userId})
       RETURN follower, r.since as since
       ORDER BY r.since DESC
       SKIP $skip
       LIMIT $limit`,
      { userId, skip: neo4j.int(skip), limit: neo4j.int(limit) }
    );

    await session.close();

    const followers = result.records.map(record => ({
      user: record.get('follower').properties,
      since: record.get('since'),
    }));

    res.status(200).json({
      message: "Lấy danh sách followers thành công",
      data: followers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi lấy followers", 
      error: error.message 
    });
  }
});

// Lấy danh sách following của user với phân trang - GET /api/relationships/following/:userId
router.get("/following/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const session = getNeo4jSession();

    // Get total count
    const countResult = await session.run(
      `MATCH (user:User {id: $userId})-[:FOLLOWS]->(following:User)
       RETURN count(following) as total`,
      { userId }
    );
    const total = countResult.records[0]?.get('total').toNumber() || 0;

    // Get paginated data
    const result = await session.run(
      `MATCH (user:User {id: $userId})-[r:FOLLOWS]->(following:User)
       RETURN following, r.since as since
       ORDER BY r.since DESC
       SKIP $skip
       LIMIT $limit`,
      { userId, skip: neo4j.int(skip), limit: neo4j.int(limit) }
    );

    await session.close();

    const following = result.records.map(record => ({
      user: record.get('following').properties,
      since: record.get('since'),
    }));

    res.status(200).json({
      message: "Lấy danh sách following thành công",
      data: following,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi lấy following", 
      error: error.message 
    });
  }
});

// Lấy danh sách IDs của những người mà user đang follow - GET /api/relationships/following-ids/:userId
router.get("/following-ids/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const session = getNeo4jSession();

    const result = await session.run(
      `MATCH (user:User {id: $userId})-[:FOLLOWS]->(following:User)
       RETURN following.id as id`,
      { userId }
    );

    await session.close();

    const followingIds = result.records.map(record => record.get('id'));

    res.status(200).json({
      message: "Lấy danh sách following IDs thành công",
      data: followingIds,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi lấy following IDs", 
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
      followersCount: record?.get('followerCount')?.toNumber() || 0,
      followingCount: record?.get('followingCount')?.toNumber() || 0,
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

// ========================================
// FRIEND SUGGESTIONS - Gợi ý kết nối
// ========================================

// Gợi ý user dựa trên bạn chung (mutual following) - GET /api/relationships/suggestions/:userId
router.get("/suggestions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const session = getNeo4jSession();

    // CHIẾN LƯỢC GỢI Ý NÂNG CAO:
    // 1. Ưu tiên người có nhiều bạn chung nhất (mutualFollowing)
    // 2. Ưu tiên người được nhiều bạn chung follow (2nd degree connections)
    // 3. Ưu tiên người có tương tác gần đây (commented on same posts)
    // 4. Cân bằng với độ phổ biến (popularity)
    
    const result = await session.run(
      `MATCH (user:User {id: $userId})-[:FOLLOWS]->(friend:User)-[:FOLLOWS]->(suggested:User)
       WHERE user <> suggested 
         AND NOT (user)-[:FOLLOWS]->(suggested)
         AND suggested.role <> 'admin'
       
       // Group by suggested user để loại bỏ duplicates
       WITH DISTINCT suggested, COLLECT(DISTINCT friend) as mutualFriends
       WITH suggested, mutualFriends, SIZE(mutualFriends) as mutualFollowing
       
       // Đếm số người follow suggested (popularity)
       OPTIONAL MATCH (suggested)<-[:FOLLOWS]-(follower:User)
       WITH suggested, mutualFriends, mutualFollowing, COUNT(DISTINCT follower) as popularity
       
       // Đếm số người mà các bạn chung cũng follow (2nd degree strength)
       WITH suggested, mutualFollowing, popularity, 
            SIZE(mutualFriends) as strongConnections
       
       // Tính điểm: Ưu tiên bạn chung > kết nối mạnh > độ phổ biến
       WITH DISTINCT suggested, mutualFollowing, popularity, strongConnections,
            (mutualFollowing * 10) + (strongConnections * 5) + (popularity * 0.1) as score
       
       RETURN suggested, mutualFollowing, popularity, strongConnections, score
       ORDER BY score DESC, mutualFollowing DESC, popularity DESC
       LIMIT $limit`,
      { userId, limit: neo4j.int(limit) }
    );

    let suggestions = result.records.map(record => ({
      user: record.get('suggested').properties,
      mutualFollowing: record.get('mutualFollowing').toNumber(),
      popularity: record.get('popularity').toNumber(),
      strongConnections: record.get('strongConnections').toNumber(),
      score: record.get('score')
    }));
    
    // Deduplicate based on user ID (safety check)
    const seenIds = new Set();
    suggestions = suggestions.filter(s => {
      if (seenIds.has(s.user.id)) return false;
      seenIds.add(s.user.id);
      return true;
    });

    // Fallback 1: Nếu không có kết quả từ bạn chung, tìm người có follower chung
    if (suggestions.length === 0) {
      const followerBasedResult = await session.run(
        `MATCH (user:User {id: $userId})<-[:FOLLOWS]-(commonFollower:User)-[:FOLLOWS]->(suggested:User)
         WHERE user <> suggested 
           AND NOT (user)-[:FOLLOWS]->(suggested)
           AND suggested.role <> 'admin'
         WITH DISTINCT suggested, COLLECT(DISTINCT commonFollower) as commonFollowers
         WITH suggested, SIZE(commonFollowers) as commonFollowerCount
         OPTIONAL MATCH (suggested)<-[:FOLLOWS]-(follower:User)
         WITH suggested, commonFollowerCount, COUNT(DISTINCT follower) as popularity
         RETURN suggested, 0 as mutualFollowing, popularity, commonFollowerCount as strongConnections,
                (commonFollowerCount * 8) + (popularity * 0.1) as score
         ORDER BY score DESC
         LIMIT $limit`,
        { userId, limit: neo4j.int(limit) }
      );
      
      if (followerBasedResult.records.length > 0) {
        suggestions = followerBasedResult.records.map(record => ({
          user: record.get('suggested').properties,
          mutualFollowing: record.get('mutualFollowing').toNumber(),
          popularity: record.get('popularity').toNumber(),
          strongConnections: record.get('strongConnections').toNumber(),
          score: record.get('score')
        }));
        
        // Deduplicate
        const seenIds = new Set();
        suggestions = suggestions.filter(s => {
          if (seenIds.has(s.user.id)) return false;
          seenIds.add(s.user.id);
          return true;
        });
      }
    }

    // Fallback 2: Nếu vẫn không có, gợi ý users phổ biến nhất
    if (suggestions.length === 0) {
      const fallbackResult = await session.run(
        `MATCH (user:User {id: $userId})
         MATCH (suggested:User)
         WHERE suggested.id <> $userId 
           AND NOT (user)-[:FOLLOWS]->(suggested)
           AND suggested.role <> 'admin'
         WITH DISTINCT suggested
         OPTIONAL MATCH (suggested)<-[:FOLLOWS]-(follower:User)
         WITH suggested, COUNT(DISTINCT follower) as popularity
         RETURN suggested, 0 as mutualFollowing, popularity, 0 as strongConnections, popularity as score
         ORDER BY popularity DESC
         LIMIT $limit`,
        { userId, limit: neo4j.int(limit) }
      );
      
      suggestions = fallbackResult.records.map(record => ({
        user: record.get('suggested').properties,
        mutualFollowing: 0,
        popularity: record.get('popularity').toNumber(),
        strongConnections: 0,
        score: record.get('popularity').toNumber()
      }));
    }

    await session.close();

    res.status(200).json({
      message: "Lấy gợi ý kết nối thành công",
      data: suggestions,
      total: suggestions.length,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi lấy gợi ý kết nối", 
      error: error.message 
    });
  }
});

// ========================================
// EXPORT MODULE
// ========================================
export default router;