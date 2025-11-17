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

    // Kiểm tra nếu follower là admin thì không cho follow
    const User = (await import('../models/users.model.js')).default;
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
      { userId, skip: skip, limit: limit }
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
      { userId, skip: skip, limit: limit }
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
       RETURN mutual`,
      { userId1, userId2 }
    );

    await session.close();

    const mutualFriends = result.records.map(record => 
      record.get('mutual').properties
    );

    res.status(200).json({
      message: "Lấy danh sách bạn chung thành công",
      data: mutualFriends,
      total: mutualFriends.length,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi lấy bạn chung", 
      error: error.message 
    });
  }
});

// Get mutual followers (follow chéo) - GET /api/relationships/mutual-followers/:userId
router.get("/mutual-followers/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const session = getNeo4jSession();

    // Lấy những người follow chéo (tôi follow họ VÀ họ follow tôi)
    const result = await session.run(
      `MATCH (me:User {id: $userId})-[:FOLLOWS]->(mutual:User)-[:FOLLOWS]->(me)
       RETURN mutual
       SKIP $skip
       LIMIT $limit`,
      { userId, skip: parseInt(skip), limit: parseInt(limit) }
    );

    // Đếm tổng số mutual followers
    const countResult = await session.run(
      `MATCH (me:User {id: $userId})-[:FOLLOWS]->(mutual:User)-[:FOLLOWS]->(me)
       RETURN COUNT(mutual) as total`,
      { userId }
    );

    await session.close();

    const mutualFollowers = result.records.map(record => {
      const user = record.get('mutual').properties;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
      };
    });

    const total = countResult.records[0].get('total').toNumber();

    res.status(200).json({
      message: "Lấy danh sách người follow chéo thành công",
      data: mutualFollowers,
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
      message: "Lỗi khi lấy người follow chéo", 
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

    // Tìm users mà bạn bè của userId đang follow, nhưng userId chưa follow
    // và tính điểm dựa trên số bạn chung
    const result = await session.run(
      `MATCH (user:User {id: $userId})-[:FOLLOWS]->(friend:User)-[:FOLLOWS]->(suggested:User)
       WHERE user <> suggested 
         AND NOT (user)-[:FOLLOWS]->(suggested)
         AND suggested.role <> 'admin'
       WITH suggested, COUNT(DISTINCT friend) as mutualFollowing
       MATCH (suggested)<-[:FOLLOWS]-(follower:User)
       WITH suggested, mutualFollowing, COUNT(DISTINCT follower) as popularity
       RETURN suggested, mutualFollowing, popularity
       ORDER BY mutualFollowing DESC, popularity DESC
       LIMIT $limit`,
      { userId, limit }
    );

    await session.close();

    const suggestions = result.records.map(record => ({
      user: record.get('suggested').properties,
      mutualFollowing: record.get('mutualFollowing').toNumber(),
      popularity: record.get('popularity').toNumber(),
      score: record.get('mutualFollowing').toNumber() * 2 + record.get('popularity').toNumber()
    }));

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

// Gợi ý dựa trên followers chung - GET /api/relationships/suggestions/by-followers/:userId
router.get("/suggestions/by-followers/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const session = getNeo4jSession();

    // Tìm users có cùng followers với userId
    const result = await session.run(
      `MATCH (user:User {id: $userId})<-[:FOLLOWS]-(commonFollower:User)-[:FOLLOWS]->(suggested:User)
       WHERE user <> suggested 
         AND NOT (user)-[:FOLLOWS]->(suggested)
         AND suggested.role <> 'admin'
       WITH suggested, COUNT(DISTINCT commonFollower) as commonFollowers
       MATCH (suggested)<-[:FOLLOWS]-(allFollowers:User)
       RETURN suggested, commonFollowers, COUNT(DISTINCT allFollowers) as totalFollowers
       ORDER BY commonFollowers DESC, totalFollowers DESC
       LIMIT $limit`,
      { userId, limit }
    );

    await session.close();

    const suggestions = result.records.map(record => ({
      user: record.get('suggested').properties,
      commonFollowers: record.get('commonFollowers').toNumber(),
      totalFollowers: record.get('totalFollowers').toNumber(),
    }));

    res.status(200).json({
      message: "Lấy gợi ý dựa trên followers chung thành công",
      data: suggestions,
      total: suggestions.length,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi lấy gợi ý dựa trên followers", 
      error: error.message 
    });
  }
});

// Gợi ý "similar interests" - users trong vòng 2-3 bước - GET /api/relationships/suggestions/extended/:userId
router.get("/suggestions/extended/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const session = getNeo4jSession();

    // Tìm users cách 2-3 bước trong network
    const result = await session.run(
      `MATCH path = (user:User {id: $userId})-[:FOLLOWS*2..3]->(suggested:User)
       WHERE user <> suggested 
         AND NOT (user)-[:FOLLOWS]->(suggested)
         AND suggested.role <> 'admin'
       WITH suggested, LENGTH(path) as distance
       WITH suggested, MIN(distance) as minDistance, COUNT(*) as pathCount
       MATCH (suggested)<-[:FOLLOWS]-(follower:User)
       RETURN suggested, minDistance, pathCount, COUNT(DISTINCT follower) as popularity
       ORDER BY minDistance ASC, pathCount DESC, popularity DESC
       LIMIT $limit`,
      { userId, limit }
    );

    await session.close();

    const suggestions = result.records.map(record => ({
      user: record.get('suggested').properties,
      distance: record.get('minDistance').toNumber(),
      pathCount: record.get('pathCount').toNumber(),
      popularity: record.get('popularity').toNumber(),
    }));

    res.status(200).json({
      message: "Lấy gợi ý mở rộng thành công",
      data: suggestions,
      total: suggestions.length,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi lấy gợi ý mở rộng", 
      error: error.message 
    });
  }
});

// ========================================
// NETWORK ANALYSIS - Phân tích mạng
// ========================================

// Tính độ ảnh hưởng của users (influence score) - GET /api/relationships/influence
router.get("/influence", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const session = getNeo4jSession();

    // Tính influence dựa trên followers và engagement
    const result = await session.run(
      `MATCH (u:User)
       WHERE u.role <> 'admin'
       OPTIONAL MATCH (u)<-[:FOLLOWS]-(follower:User)
       WITH u, COUNT(DISTINCT follower) as followerCount
       OPTIONAL MATCH (u)-[:FOLLOWS]->(following:User)
       WITH u, followerCount, COUNT(DISTINCT following) as followingCount
       WITH u, followerCount, followingCount,
            CASE 
              WHEN followingCount = 0 THEN followerCount
              ELSE toFloat(followerCount) / followingCount
            END as ratio
       RETURN u, followerCount, followingCount, ratio as influenceScore
       ORDER BY influenceScore DESC, followerCount DESC
       LIMIT $limit`,
      { limit }
    );

    await session.close();

    const influencers = result.records.map(record => ({
      user: record.get('u').properties,
      followers: record.get('followerCount').toNumber(),
      following: record.get('followingCount').toNumber(),
      influenceScore: parseFloat(record.get('influenceScore').toFixed(2)),
    }));

    res.status(200).json({
      message: "Lấy danh sách influencers thành công",
      data: influencers,
      total: influencers.length,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi tính influence score", 
      error: error.message 
    });
  }
});

// Tính centrality (degree centrality) - GET /api/relationships/centrality
router.get("/centrality", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const session = getNeo4jSession();

    // Tính degree centrality (tổng số connections)
    const result = await session.run(
      `MATCH (u:User)
       WHERE u.role <> 'admin'
       OPTIONAL MATCH (u)-[r:FOLLOWS]-(other:User)
       WITH u, COUNT(r) as totalConnections
       RETURN u, totalConnections
       ORDER BY totalConnections DESC
       LIMIT $limit`,
      { limit }
    );

    await session.close();

    const centralUsers = result.records.map(record => ({
      user: record.get('u').properties,
      totalConnections: record.get('totalConnections').toNumber(),
    }));

    res.status(200).json({
      message: "Lấy centrality thành công",
      data: centralUsers,
      total: centralUsers.length,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi tính centrality", 
      error: error.message 
    });
  }
});

// Tìm shortest path giữa 2 users - GET /api/relationships/path/:userId1/:userId2
router.get("/path/:userId1/:userId2", async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const session = getNeo4jSession();

    // Tìm đường đi ngắn nhất
    const result = await session.run(
      `MATCH (start:User {id: $userId1}), (end:User {id: $userId2})
       MATCH path = shortestPath((start)-[:FOLLOWS*]-(end))
       RETURN path, LENGTH(path) as distance,
              [node in nodes(path) | node.username] as usernames`,
      { userId1, userId2 }
    );

    await session.close();

    if (result.records.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy đường nối giữa 2 users",
        data: {
          userId1,
          userId2,
          connected: false,
        },
      });
    }

    const record = result.records[0];
    const pathData = {
      distance: record.get('distance').toNumber(),
      usernames: record.get('usernames'),
      connected: true,
    };

    res.status(200).json({
      message: "Tìm đường đi thành công",
      data: pathData,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi tìm đường đi", 
      error: error.message 
    });
  }
});

// Phân tích mạng của 1 user cụ thể - GET /api/relationships/user-network/:userId
router.get("/user-network/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const depth = parseInt(req.query.depth) || 2;
    const session = getNeo4jSession();

    // Lấy network trong phạm vi N bước
    const result = await session.run(
      `MATCH (user:User {id: $userId})
       OPTIONAL MATCH path = (user)-[:FOLLOWS*1..$depth]-(connected:User)
       WITH user, collect(DISTINCT connected) as connectedUsers
       UNWIND connectedUsers as cu
       OPTIONAL MATCH (cu)-[r:FOLLOWS]-(other:User)
       WHERE other IN connectedUsers OR other = user
       RETURN user, connectedUsers, collect(DISTINCT {from: cu.id, to: other.id, type: type(r)}) as edges`,
      { userId, depth }
    );

    await session.close();

    if (result.records.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy user hoặc user chưa có network",
      });
    }

    const record = result.records[0];
    const connectedUsers = record.get('connectedUsers').map(u => u.properties);
    const edges = record.get('edges').filter(e => e.from && e.to);

    res.status(200).json({
      message: "Lấy user network thành công",
      data: {
        user: record.get('user').properties,
        connectedUsers,
        edges,
        stats: {
          totalConnections: connectedUsers.length,
          totalEdges: edges.length,
          depth,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi phân tích user network", 
      error: error.message 
    });
  }
});

// ========================================
// COMMUNITY DETECTION - Phát hiện cộng đồng
// ========================================

// Tìm các nhóm users có kết nối chặt chẽ (tightly connected clusters) - GET /api/relationships/communities
router.get("/communities", async (req, res) => {
  try {
    const minClusterSize = parseInt(req.query.minSize) || 3;
    const session = getNeo4jSession();

    // Tìm các connected components - nhóm users có liên kết với nhau
    const result = await session.run(
      `MATCH (u:User)
       WHERE u.role <> 'admin'
       OPTIONAL MATCH path = (u)-[:FOLLOWS*1..3]-(connected:User)
       WHERE connected.role <> 'admin'
       WITH u, collect(DISTINCT connected) as cluster
       WHERE size(cluster) >= $minSize
       WITH cluster, size(cluster) as clusterSize
       UNWIND cluster as member
       WITH cluster, clusterSize, collect(DISTINCT member) as members
       RETURN members, clusterSize
       ORDER BY clusterSize DESC
       LIMIT 10`,
      { minSize: minClusterSize }
    );

    await session.close();

    const communities = result.records.map((record, index) => ({
      id: index + 1,
      members: record.get('members').map(m => m.properties),
      size: record.get('clusterSize').toNumber(),
    }));

    res.status(200).json({
      message: "Phát hiện cộng đồng thành công",
      data: communities,
      total: communities.length,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi phát hiện cộng đồng", 
      error: error.message 
    });
  }
});

// Tìm các cliques (nhóm users follow lẫn nhau) - GET /api/relationships/cliques
router.get("/cliques", async (req, res) => {
  try {
    const minSize = parseInt(req.query.minSize) || 3;
    const session = getNeo4jSession();

    // Tìm các nhóm users có mutual following
    const result = await session.run(
      `MATCH (u1:User)-[:FOLLOWS]->(u2:User)-[:FOLLOWS]->(u3:User)-[:FOLLOWS]->(u1)
       WHERE u1.role <> 'admin' AND u2.role <> 'admin' AND u3.role <> 'admin'
         AND id(u1) < id(u2) AND id(u2) < id(u3)
       RETURN DISTINCT [u1, u2, u3] as clique
       LIMIT 20`
    );

    await session.close();

    const cliques = result.records.map((record, index) => ({
      id: index + 1,
      members: record.get('clique').map(u => u.properties),
      size: 3,
      type: 'triangular_clique'
    }));

    res.status(200).json({
      message: "Tìm cliques thành công",
      data: cliques,
      total: cliques.length,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi tìm cliques", 
      error: error.message 
    });
  }
});

// Tìm users làm cầu nối giữa các cộng đồng (bridge users) - GET /api/relationships/bridges
router.get("/bridges", async (req, res) => {
  try {
    const session = getNeo4jSession();

    // Tìm users có nhiều kết nối với các nhóm khác nhau
    const result = await session.run(
      `MATCH (bridge:User)-[:FOLLOWS]->(connected:User)
       WHERE bridge.role <> 'admin' AND connected.role <> 'admin'
       WITH bridge, collect(DISTINCT connected) as connections
       WHERE size(connections) >= 3
       MATCH (bridge)-[:FOLLOWS]->(c1:User), (bridge)-[:FOLLOWS]->(c2:User)
       WHERE c1 <> c2 AND NOT (c1)-[:FOLLOWS]-(c2)
       WITH bridge, connections, COUNT(*) as bridgeScore
       RETURN bridge, size(connections) as totalConnections, bridgeScore
       ORDER BY bridgeScore DESC, totalConnections DESC
       LIMIT 20`
    );

    await session.close();

    const bridges = result.records.map(record => ({
      user: record.get('bridge').properties,
      totalConnections: record.get('totalConnections').toNumber(),
      bridgeScore: record.get('bridgeScore').toNumber(),
    }));

    res.status(200).json({
      message: "Tìm bridge users thành công",
      data: bridges,
      total: bridges.length,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi tìm bridge users", 
      error: error.message 
    });
  }
});

// Phân tích mật độ kết nối của network - GET /api/relationships/network-density
router.get("/network-density", async (req, res) => {
  try {
    const session = getNeo4jSession();

    // Tính mật độ network
    const result = await session.run(
      `MATCH (u:User)
       WHERE u.role <> 'admin'
       WITH COUNT(u) as totalUsers
       MATCH ()-[r:FOLLOWS]->()
       WITH totalUsers, COUNT(r) as totalRelationships
       WITH totalUsers, totalRelationships,
            toFloat(totalRelationships) / (totalUsers * (totalUsers - 1)) as density
       RETURN totalUsers, totalRelationships, density,
              toFloat(totalRelationships) / totalUsers as avgConnectionsPerUser`
    );

    await session.close();

    if (result.records.length === 0) {
      return res.status(200).json({
        message: "Network chưa có dữ liệu",
        data: {
          totalUsers: 0,
          totalRelationships: 0,
          density: 0,
          avgConnectionsPerUser: 0,
        },
      });
    }

    const record = result.records[0];
    const networkStats = {
      totalUsers: record.get('totalUsers').toNumber(),
      totalRelationships: record.get('totalRelationships').toNumber(),
      density: parseFloat(record.get('density').toFixed(4)),
      avgConnectionsPerUser: parseFloat(record.get('avgConnectionsPerUser').toFixed(2)),
    };

    res.status(200).json({
      message: "Phân tích mật độ network thành công",
      data: networkStats,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi phân tích network density", 
      error: error.message 
    });
  }
});

export default router;