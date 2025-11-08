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
// 8. CRUD OPERATIONS VIA CYPHER
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