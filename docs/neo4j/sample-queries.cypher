// Sample Neo4j Queries cho Social Network Mini
// Chạy các queries này trong Neo4j Browser (http://localhost:7474)

// =================================
// 1. SETUP - Tạo constraints và indexes
// =================================

// Tạo constraint unique cho User ID
CREATE CONSTRAINT user_id_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

// Tạo indexes để tối ưu performance
CREATE INDEX user_email_index IF NOT EXISTS
FOR (u:User) ON (u.email);

CREATE INDEX user_username_index IF NOT EXISTS  
FOR (u:User) ON (u.username);

// =================================
// 2. SAMPLE DATA - Tạo dữ liệu mẫu
// =================================

// Xóa dữ liệu cũ (nếu có)
MATCH (n) DETACH DELETE n;

// Tạo users
CREATE (u1:User {
  id: 1, 
  username: 'john_doe', 
  email: 'john@example.com', 
  name: 'John Doe',
  bio: 'Software Developer',
  created_at: datetime()
})
CREATE (u2:User {
  id: 2, 
  username: 'jane_smith', 
  email: 'jane@example.com', 
  name: 'Jane Smith',
  bio: 'Designer & Photographer',
  created_at: datetime()
})
CREATE (u3:User {
  id: 3, 
  username: 'bob_wilson', 
  email: 'bob@example.com', 
  name: 'Bob Wilson',
  bio: 'Data Scientist',
  created_at: datetime()
})
CREATE (u4:User {
  id: 4, 
  username: 'alice_johnson', 
  email: 'alice@example.com', 
  name: 'Alice Johnson',
  bio: 'Product Manager',
  created_at: datetime()
})
CREATE (u5:User {
  id: 5, 
  username: 'charlie_brown', 
  email: 'charlie@example.com', 
  name: 'Charlie Brown',
  bio: 'Marketing Specialist',
  created_at: datetime()
})
CREATE (u6:User {
  id: 6, 
  username: 'diana_prince', 
  email: 'diana@example.com', 
  name: 'Diana Prince',
  bio: 'UX Designer',
  created_at: datetime()
})
CREATE (u7:User {
  id: 7, 
  username: 'edward_norton', 
  email: 'edward@example.com', 
  name: 'Edward Norton',
  bio: 'DevOps Engineer',
  created_at: datetime()
})
CREATE (u8:User {
  id: 8, 
  username: 'fiona_apple', 
  email: 'fiona@example.com', 
  name: 'Fiona Apple',
  bio: 'Content Creator',
  created_at: datetime()
});

// =================================
// 3. RELATIONSHIPS - Tạo mối quan hệ
// =================================

// FOLLOWS relationships
MATCH (u1:User {id: 1}), (u2:User {id: 2})
CREATE (u1)-[:FOLLOWS {since: datetime()}]->(u2);

MATCH (u1:User {id: 1}), (u3:User {id: 3})
CREATE (u1)-[:FOLLOWS {since: datetime()}]->(u3);

MATCH (u1:User {id: 1}), (u4:User {id: 4})
CREATE (u1)-[:FOLLOWS {since: datetime()}]->(u4);

MATCH (u2:User {id: 2}), (u1:User {id: 1})
CREATE (u2)-[:FOLLOWS {since: datetime()}]->(u1);

MATCH (u2:User {id: 2}), (u5:User {id: 5})
CREATE (u2)-[:FOLLOWS {since: datetime()}]->(u5);

MATCH (u3:User {id: 3}), (u4:User {id: 4})
CREATE (u3)-[:FOLLOWS {since: datetime()}]->(u4);

MATCH (u4:User {id: 4}), (u6:User {id: 6})
CREATE (u4)-[:FOLLOWS {since: datetime()}]->(u6);

MATCH (u5:User {id: 5}), (u7:User {id: 7})
CREATE (u5)-[:FOLLOWS {since: datetime()}]->(u7);

MATCH (u6:User {id: 6}), (u8:User {id: 8})
CREATE (u6)-[:FOLLOWS {since: datetime()}]->(u8);

MATCH (u7:User {id: 7}), (u1:User {id: 1})
CREATE (u7)-[:FOLLOWS {since: datetime()}]->(u1);

// FRIENDS relationships (mutual)
MATCH (u1:User {id: 1}), (u2:User {id: 2})
CREATE (u1)-[:FRIENDS {since: datetime()}]->(u2),
       (u2)-[:FRIENDS {since: datetime()}]->(u1);

MATCH (u3:User {id: 3}), (u4:User {id: 4})
CREATE (u3)-[:FRIENDS {since: datetime()}]->(u4),
       (u4)-[:FRIENDS {since: datetime()}]->(u3);

MATCH (u5:User {id: 5}), (u6:User {id: 6})
CREATE (u5)-[:FRIENDS {since: datetime()}]->(u6),
       (u6)-[:FRIENDS {since: datetime()}]->(u5);

// =================================
// 4. BASIC QUERIES - Truy vấn cơ bản
// =================================

// Hiển thị tất cả users
MATCH (u:User) 
RETURN u.id, u.username, u.name, u.email 
ORDER BY u.id;

// Hiển thị tất cả relationships
MATCH (u1:User)-[r]->(u2:User) 
RETURN u1.username, type(r), u2.username;

// =================================
// 5. SOCIAL NETWORK QUERIES
// =================================

// Ai đang follow user với id = 1?
MATCH (follower:User)-[:FOLLOWS]->(user:User {id: 1})
RETURN follower.username, follower.name;

// User với id = 1 đang follow ai?
MATCH (user:User {id: 1})-[:FOLLOWS]->(following:User)
RETURN following.username, following.name;

// Danh sách bạn bè của user với id = 1
MATCH (user:User {id: 1})-[:FRIENDS]-(friend:User)
RETURN friend.username, friend.name;

// Đếm số followers của mỗi user
MATCH (u:User)
OPTIONAL MATCH (follower:User)-[:FOLLOWS]->(u)
RETURN u.username, u.name, COUNT(follower) as follower_count
ORDER BY follower_count DESC;

// Đếm số người mà mỗi user đang follow
MATCH (u:User)
OPTIONAL MATCH (u)-[:FOLLOWS]->(following:User)
RETURN u.username, u.name, COUNT(following) as following_count
ORDER BY following_count DESC;

// =================================
// 6. ADVANCED QUERIES
// =================================

// Gợi ý kết bạn: Tìm bạn của bạn (không phải bạn trực tiếp)
MATCH (user:User {id: 1})-[:FRIENDS]-(friend:User)-[:FRIENDS]-(friendOfFriend:User)
WHERE user <> friendOfFriend 
  AND NOT (user)-[:FRIENDS]-(friendOfFriend)
RETURN DISTINCT friendOfFriend.username, friendOfFriend.name, 
       COUNT(friend) as mutual_friends
ORDER BY mutual_friends DESC;

// Tìm mutual followers (người mà cả 2 users đều follow)
MATCH (user1:User {id: 1})-[:FOLLOWS]->(mutual:User)<-[:FOLLOWS]-(user2:User {id: 2})
RETURN mutual.username, mutual.name;

// Shortest path giữa 2 users
MATCH path = shortestPath((user1:User {id: 1})-[*]-(user2:User {id: 8}))
RETURN path;

// Users có nhiều friends nhất
MATCH (u:User)
OPTIONAL MATCH (u)-[:FRIENDS]-(friend:User)
RETURN u.username, u.name, COUNT(friend) as friend_count
ORDER BY friend_count DESC
LIMIT 5;

// Tìm users có influence cao (nhiều followers)
MATCH (u:User)
OPTIONAL MATCH (follower:User)-[:FOLLOWS]->(u)
WITH u, COUNT(follower) as follower_count
WHERE follower_count > 0
RETURN u.username, u.name, follower_count
ORDER BY follower_count DESC;

// =================================
// 7. NETWORK ANALYSIS
// =================================

// Tính degree centrality (tổng số connections)
MATCH (u:User)
OPTIONAL MATCH (u)-[r]-(other:User)
RETURN u.username, u.name, COUNT(r) as total_connections
ORDER BY total_connections DESC;

// Tìm connected components (nhóm kết nối)
CALL gds.graph.project(
  'socialNetwork',
  'User',
  ['FOLLOWS', 'FRIENDS']
);

// Phát hiện communities
CALL gds.louvain.stream('socialNetwork')
YIELD nodeId, communityId
RETURN gds.util.asNode(nodeId).username as username,
       gds.util.asNode(nodeId).name as name,
       communityId
ORDER BY communityId, username;

// =================================
// 8. FRIEND SUGGESTIONS - Gợi ý kết nối
// =================================

// Gợi ý user dựa trên bạn chung (people you may know)
MATCH (user:User {id: 1})-[:FOLLOWS]->(friend:User)-[:FOLLOWS]->(suggested:User)
WHERE user <> suggested 
  AND NOT (user)-[:FOLLOWS]->(suggested)
WITH suggested, COUNT(DISTINCT friend) as mutualFollowing
MATCH (suggested)<-[:FOLLOWS]-(follower:User)
WITH suggested, mutualFollowing, COUNT(DISTINCT follower) as popularity
RETURN suggested.username, suggested.name, mutualFollowing, popularity
ORDER BY mutualFollowing DESC, popularity DESC
LIMIT 10;

// Gợi ý dựa trên followers chung (similar audience)
MATCH (user:User {id: 1})<-[:FOLLOWS]-(commonFollower:User)-[:FOLLOWS]->(suggested:User)
WHERE user <> suggested 
  AND NOT (user)-[:FOLLOWS]->(suggested)
WITH suggested, COUNT(DISTINCT commonFollower) as commonFollowers
MATCH (suggested)<-[:FOLLOWS]-(allFollowers:User)
RETURN suggested.username, suggested.name, commonFollowers, COUNT(DISTINCT allFollowers) as totalFollowers
ORDER BY commonFollowers DESC, totalFollowers DESC
LIMIT 10;

// Gợi ý users trong vòng 2-3 bước (extended network)
MATCH path = (user:User {id: 1})-[:FOLLOWS*2..3]->(suggested:User)
WHERE user <> suggested 
  AND NOT (user)-[:FOLLOWS]->(suggested)
WITH suggested, LENGTH(path) as distance
WITH suggested, MIN(distance) as minDistance, COUNT(*) as pathCount
MATCH (suggested)<-[:FOLLOWS]-(follower:User)
RETURN suggested.username, suggested.name, minDistance, pathCount, COUNT(DISTINCT follower) as popularity
ORDER BY minDistance ASC, pathCount DESC, popularity DESC
LIMIT 10;

// =================================
// 9. NETWORK ANALYSIS - Phân tích mạng
// =================================

// Tính độ ảnh hưởng (influence score) dựa trên tỷ lệ followers/following
MATCH (u:User)
OPTIONAL MATCH (u)<-[:FOLLOWS]-(follower:User)
WITH u, COUNT(DISTINCT follower) as followerCount
OPTIONAL MATCH (u)-[:FOLLOWS]->(following:User)
WITH u, followerCount, COUNT(DISTINCT following) as followingCount
WITH u, followerCount, followingCount,
     CASE 
       WHEN followingCount = 0 THEN followerCount
       ELSE toFloat(followerCount) / followingCount
     END as influenceScore
RETURN u.username, u.name, followerCount, followingCount, influenceScore
ORDER BY influenceScore DESC, followerCount DESC
LIMIT 20;

// Tìm shortest path giữa 2 users (degrees of separation)
MATCH (start:User {id: 1}), (end:User {id: 8})
MATCH path = shortestPath((start)-[:FOLLOWS*]-(end))
RETURN LENGTH(path) as distance,
       [node in nodes(path) | node.username] as usernames,
       [rel in relationships(path) | type(rel)] as relationshipTypes;

// Phân tích network của 1 user trong phạm vi N bước
MATCH (user:User {id: 1})
OPTIONAL MATCH path = (user)-[:FOLLOWS*1..2]-(connected:User)
WITH user, collect(DISTINCT connected) as connectedUsers
RETURN user.username, 
       size(connectedUsers) as networkSize,
       [u in connectedUsers | u.username] as connectedUsernames;

// Tính betweenness centrality (users làm cầu nối)
MATCH (u1:User)-[:FOLLOWS*2]-(u2:User)
WHERE u1 <> u2
WITH u1, u2, 
     [path in allShortestPaths((u1)-[:FOLLOWS*]-(u2)) | nodes(path)] as paths
UNWIND paths as path
UNWIND path as node
WITH node, COUNT(*) as betweenness
WHERE node:User
RETURN node.username, node.name, betweenness
ORDER BY betweenness DESC
LIMIT 20;

// =================================
// 10. COMMUNITY DETECTION - Phát hiện cộng đồng
// =================================

// Tìm các triangles (3 users follow lẫn nhau)
MATCH (u1:User)-[:FOLLOWS]->(u2:User)-[:FOLLOWS]->(u3:User)-[:FOLLOWS]->(u1)
WHERE id(u1) < id(u2) AND id(u2) < id(u3)
RETURN u1.username, u2.username, u3.username
LIMIT 20;

// Tìm các cliques (nhóm users có kết nối chặt chẽ)
MATCH (u:User)-[:FOLLOWS]-(connected:User)
WITH u, collect(DISTINCT connected) as connections
WHERE size(connections) >= 3
UNWIND connections as c1
UNWIND connections as c2
WHERE c1 <> c2 AND (c1)-[:FOLLOWS]-(c2)
WITH u, connections, COUNT(DISTINCT [c1, c2]) as internalLinks
RETURN u.username, size(connections) as clusterSize, internalLinks
ORDER BY clusterSize DESC, internalLinks DESC
LIMIT 20;

// Tìm users làm cầu nối giữa các cộng đồng (bridge users)
MATCH (bridge:User)-[:FOLLOWS]->(connected:User)
WITH bridge, collect(DISTINCT connected) as connections
WHERE size(connections) >= 3
MATCH (bridge)-[:FOLLOWS]->(c1:User), (bridge)-[:FOLLOWS]->(c2:User)
WHERE c1 <> c2 AND NOT (c1)-[:FOLLOWS]-(c2)
WITH bridge, connections, COUNT(*) as bridgeScore
RETURN bridge.username, bridge.name, size(connections) as totalConnections, bridgeScore
ORDER BY bridgeScore DESC, totalConnections DESC
LIMIT 20;

// Phân tích mật độ network (network density)
MATCH (u:User)
WITH COUNT(u) as totalUsers
MATCH ()-[r:FOLLOWS]->()
WITH totalUsers, COUNT(r) as totalRelationships
RETURN totalUsers, 
       totalRelationships,
       toFloat(totalRelationships) / (totalUsers * (totalUsers - 1)) as density,
       toFloat(totalRelationships) / totalUsers as avgConnectionsPerUser;

// Tìm các connected components (nhóm users có liên kết với nhau)
MATCH (u:User)
OPTIONAL MATCH path = (u)-[:FOLLOWS*1..3]-(connected:User)
WITH u, collect(DISTINCT connected) as cluster
WHERE size(cluster) >= 3
RETURN [member in cluster | member.username] as clusterMembers,
       size(cluster) as clusterSize
ORDER BY clusterSize DESC
LIMIT 10;

// Phát hiện communities bằng label propagation (cần Neo4j Graph Data Science)
// Bước 1: Tạo graph projection
CALL gds.graph.project(
  'socialGraph',
  'User',
  {
    FOLLOWS: {
      orientation: 'UNDIRECTED'
    }
  }
)
YIELD graphName, nodeCount, relationshipCount;

// Bước 2: Chạy Label Propagation algorithm
CALL gds.labelPropagation.stream('socialGraph')
YIELD nodeId, communityId
RETURN gds.util.asNode(nodeId).username as username,
       communityId
ORDER BY communityId, username;

// Bước 3: Xóa graph projection sau khi dùng xong
CALL gds.graph.drop('socialGraph');

// =================================
// 11. ADVANCED ANALYTICS
// =================================

// Tìm influencers trong từng cộng đồng
MATCH (u:User)<-[:FOLLOWS]-(follower:User)
WITH u, COUNT(follower) as followers
WHERE followers > 2
OPTIONAL MATCH (u)-[:FOLLOWS*1..2]-(community:User)
WITH u, followers, collect(DISTINCT community) as communityMembers
RETURN u.username, u.name, followers, size(communityMembers) as communityReach
ORDER BY followers DESC, communityReach DESC
LIMIT 20;

// Phát hiện trending connections (relationships được tạo gần đây)
MATCH (u1:User)-[r:FOLLOWS]->(u2:User)
WHERE r.since > datetime() - duration({days: 7})
RETURN u1.username, u2.username, r.since
ORDER BY r.since DESC
LIMIT 50;

// Tìm isolated users (users không có connections)
MATCH (u:User)
WHERE NOT (u)-[:FOLLOWS]-()
  AND NOT (u)<-[:FOLLOWS]-()
RETURN u.username, u.name, u.email
ORDER BY u.username;

// Phân tích reciprocal relationships (follow lẫn nhau)
MATCH (u1:User)-[:FOLLOWS]->(u2:User)
WHERE (u2)-[:FOLLOWS]->(u1)
RETURN u1.username, u2.username, 'mutual' as relationship_type;

// Tính clustering coefficient (mức độ bạn bè của bạn biết nhau)
MATCH (u:User)-[:FOLLOWS]-(friend:User)
WITH u, collect(DISTINCT friend) as friends
WHERE size(friends) >= 2
UNWIND friends as f1
UNWIND friends as f2
WHERE f1 <> f2
WITH u, friends, f1, f2, 
     CASE WHEN (f1)-[:FOLLOWS]-(f2) THEN 1 ELSE 0 END as connected
WITH u, size(friends) as friendCount, SUM(connected) as actualLinks
WITH u, friendCount, actualLinks,
     toFloat(actualLinks) / (friendCount * (friendCount - 1)) as clusteringCoeff
RETURN u.username, friendCount, actualLinks, clusteringCoeff
ORDER BY clusteringCoeff DESC
LIMIT 20;

// =================================
// 12. CRUD OPERATIONS VIA CYPHER
// =================================

// Thêm user mới
CREATE (u:User {
  id: 9,
  username: 'new_user',
  email: 'newuser@example.com',
  name: 'New User',
  bio: 'Just joined!',
  created_at: datetime()
})
RETURN u;

// Cập nhật thông tin user
MATCH (u:User {id: 9})
SET u.bio = 'Updated bio: Love coding!'
RETURN u;

// Tạo relationship follow mới
MATCH (follower:User {id: 9}), (following:User {id: 1})
CREATE (follower)-[:FOLLOWS {since: datetime()}]->(following)
RETURN follower.username + ' is now following ' + following.username as message;

// Xóa relationship
MATCH (u1:User {id: 9})-[r:FOLLOWS]->(u2:User {id: 1})
DELETE r
RETURN 'Unfollowed successfully' as message;

// Xóa user (và tất cả relationships)
MATCH (u:User {id: 9})
DETACH DELETE u
RETURN 'User deleted successfully' as message;

// =================================
// 9. PERFORMANCE QUERIES
// =================================

// Xem query execution plan
EXPLAIN MATCH (u:User {id: 1})-[:FOLLOWS]->(following:User)
RETURN following.username;

// Profile query performance
PROFILE MATCH (u:User)-[:FOLLOWS]->(following:User)
WHERE u.username STARTS WITH 'j'
RETURN u.username, COUNT(following) as following_count;

// =================================
// 10. DATABASE MAINTENANCE
// =================================

// Đếm tổng số nodes và relationships
MATCH (n) RETURN COUNT(n) as total_nodes;
MATCH ()-[r]->() RETURN COUNT(r) as total_relationships;

// Kiểm tra constraints
SHOW CONSTRAINTS;

// Kiểm tra indexes
SHOW INDEXES;

// Xóa tất cả dữ liệu (CẢNH BÁO!)
// MATCH (n) DETACH DELETE n;