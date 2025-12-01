# Hướng Dẫn Truy Vấn Database Cho Testing

Tài liệu này cung cấp các lệnh truy vấn cơ bản để kiểm tra dữ liệu trong MongoDB và Neo4j.

## Mục Lục
- [Tạo User Test](#tạo-user-test)
- [MongoDB Queries](#mongodb-queries)
- [Neo4j Queries](#neo4j-queries)

---

## Tạo User Test

Để tạo một user test và lấy ID, chạy script:

```bash
# Từ thư mục backend
node scripts/create-test-user.js
```

Script sẽ tạo user mới và hiển thị ID của user đó.

---

## MongoDB Queries

### 1. Lấy thông tin User theo ID

**Sử dụng trong MongoDB Compass:**

```javascript
// Filter
{ _id: ObjectId("USER_ID_HERE") }

// Hoặc filter theo email
{ email: "user@example.com" }

// Hoặc filter theo username
{ username: "username_here" }
```

**Ví dụ cụ thể:**
```javascript
{ _id: ObjectId("674123456789abcdef012345") }
```

**Project (tùy chọn) - ẩn password:**
```javascript
{ password: 0 }
```

---

### 2. Lấy thông tin Post theo ID

**Sử dụng trong MongoDB Compass:**

```javascript
// Filter
{ _id: ObjectId("POST_ID_HERE") }

// Hoặc lấy tất cả posts của một user
{ authorId: ObjectId("USER_ID_HERE") }

// Hoặc tìm posts theo tag
{ tags: "avatar_update" }
```

**Ví dụ với aggregation để join với user info:**
```javascript
[
  {
    $match: { _id: ObjectId("POST_ID_HERE") }
  },
  {
    $lookup: {
      from: "users",
      localField: "authorId",
      foreignField: "_id",
      as: "authorInfo"
    }
  }
]
```

---

### 3. Lấy thông tin Comment theo ID

**Sử dụng trong MongoDB Compass:**

```javascript
// Filter
{ _id: ObjectId("COMMENT_ID_HERE") }

// Hoặc lấy tất cả comments của một post
{ postId: ObjectId("POST_ID_HERE") }

// Hoặc lấy comments của một user
{ authorId: ObjectId("USER_ID_HERE") }

// Lấy comments cha (không phải reply)
{ parentCommentId: null }
```

**Ví dụ với aggregation để lấy cả replies:**
```javascript
[
  {
    $match: { postId: ObjectId("POST_ID_HERE"), parentCommentId: null }
  },
  {
    $lookup: {
      from: "comments",
      localField: "_id",
      foreignField: "parentCommentId",
      as: "replies"
    }
  }
]
```

---

## Neo4j Queries

Sử dụng các query sau trong **Neo4j Desktop** hoặc **Neo4j Browser**.

### 1. Lấy thông tin User trong Neo4j

**Tìm user theo ID:**
```cypher
MATCH (u:User {id: "USER_ID_HERE"})
RETURN u
```

**Tìm user theo email:**
```cypher
MATCH (u:User {email: "user@example.com"})
RETURN u
```

**Lấy tất cả users:**
```cypher
MATCH (u:User)
RETURN u
LIMIT 10
```

**Lấy thông tin user với số lượng followers/following:**
```cypher
MATCH (u:User {id: "USER_ID_HERE"})
OPTIONAL MATCH (u)<-[:FOLLOWS]-(follower)
OPTIONAL MATCH (u)-[:FOLLOWS]->(following)
RETURN u.id as userId,
       u.name as name,
       u.email as email,
       count(DISTINCT follower) as followersCount,
       count(DISTINCT following) as followingCount
```

---

### 2. Lấy thông tin quan hệ của User

**Lấy danh sách người user đang follow:**
```cypher
MATCH (u:User {id: "USER_ID_HERE"})-[:FOLLOWS]->(following:User)
RETURN following.id, following.name, following.email
ORDER BY following.name
```

**Lấy danh sách followers của user:**
```cypher
MATCH (follower:User)-[:FOLLOWS]->(u:User {id: "USER_ID_HERE"})
RETURN follower.id, follower.name, follower.email
ORDER BY follower.name
```

**Lấy thông tin quan hệ hai chiều (mutual follow):**
```cypher
MATCH (u1:User {id: "USER_ID_1"})-[:FOLLOWS]->(u2:User {id: "USER_ID_2"})
MATCH (u2)-[:FOLLOWS]->(u1)
RETURN u1.name + " và " + u2.name + " đang follow lẫn nhau" as result
```

**Visualize toàn bộ network của một user:**
```cypher
MATCH path = (u:User {id: "USER_ID_HERE"})-[:FOLLOWS*1..2]-(other:User)
RETURN path
LIMIT 50
```

**Tìm gợi ý kết bạn (friends of friends):**
```cypher
MATCH (u:User {id: "USER_ID_HERE"})-[:FOLLOWS]->(friend)-[:FOLLOWS]->(suggestion:User)
WHERE NOT (u)-[:FOLLOWS]->(suggestion)
  AND u <> suggestion
RETURN suggestion.id, suggestion.name, suggestion.email, count(*) as mutualFriends
ORDER BY mutualFriends DESC
LIMIT 10
```

**Kiểm tra relationship giữa 2 users:**
```cypher
MATCH (u1:User {id: "USER_ID_1"})-[r:FOLLOWS]->(u2:User {id: "USER_ID_2"})
RETURN u1.name as follower,
       u2.name as followee,
       r.since as since
```

**Lấy thống kê tổng quan của user:**
```cypher
MATCH (u:User {id: "USER_ID_HERE"})
OPTIONAL MATCH (u)<-[:FOLLOWS]-(followers)
OPTIONAL MATCH (u)-[:FOLLOWS]->(following)
OPTIONAL MATCH (u)-[:FOLLOWS]->()-[:FOLLOWS]->(suggestions:User)
WHERE NOT (u)-[:FOLLOWS]->(suggestions) AND u <> suggestions
RETURN {
  user: u.name,
  followers: count(DISTINCT followers),
  following: count(DISTINCT following),
  potentialFriends: count(DISTINCT suggestions)
} as stats
```

---

## Tips

### MongoDB
- Luôn sử dụng `ObjectId()` wrapper khi filter theo `_id`
- Dùng **Aggregation** tab trong Compass cho queries phức tạp
- Indexes đã được tạo cho `email`, `username`, `authorId`

### Neo4j
- Thay `"USER_ID_HERE"` bằng ID thực tế từ MongoDB (format string)
- Sử dụng `LIMIT` để tránh trả về quá nhiều kết quả
- Click vào nodes trong Neo4j Browser để xem chi tiết
- Dùng `PROFILE` hoặc `EXPLAIN` trước query để kiểm tra performance

---

## Ví Dụ Workflow Test

1. **Tạo test user:**
   ```bash
   node scripts/create-test-user.js
   ```
   Output: `ID: 674123456789abcdef012345`

2. **Kiểm tra trong MongoDB:**
   ```javascript
   { _id: ObjectId("674123456789abcdef012345") }
   ```

3. **Kiểm tra trong Neo4j:**
   ```cypher
   MATCH (u:User {id: "674123456789abcdef012345"})
   RETURN u
   ```

4. **Tạo test relationships và kiểm tra:**
   ```cypher
   MATCH (u:User {id: "674123456789abcdef012345"})-[:FOLLOWS]->(following)
   RETURN following
   ```
