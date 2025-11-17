# Neo4j API Guide - Social Network Analysis

## Tổng quan

Hệ thống sử dụng Neo4j để quản lý và phân tích mối quan hệ follow giữa các users trong mạng xã hội. Document này mô tả chi tiết các API endpoints và use cases.

## Base URL
```
http://localhost:3000/api/relationships
```

---

## 1. QUẢN LÝ RELATIONSHIPS CƠ BẢN

### 1.1 Follow User
**Endpoint:** `POST /follow`

**Mô tả:** User follow một user khác

**Request Body:**
```json
{
  "followerId": "user_id_1",
  "followeeId": "user_id_2"
}
```

**Response:**
```json
{
  "message": "Follow thành công",
  "data": {
    "followerId": "user_id_1",
    "followeeId": "user_id_2",
    "since": "2024-01-01T00:00:00.000Z"
  }
}
```

**Lưu ý:**
- Admin không được phép follow users
- Sử dụng MERGE để tránh duplicate relationships

---

### 1.2 Unfollow User
**Endpoint:** `POST /unfollow`

**Mô tả:** Hủy follow user

**Request Body:**
```json
{
  "followerId": "user_id_1",
  "followeeId": "user_id_2"
}
```

---

### 1.3 Get Followers
**Endpoint:** `GET /followers/:userId`

**Mô tả:** Lấy danh sách người đang follow user này

**Response:**
```json
{
  "message": "Lấy danh sách followers thành công",
  "data": [
    {
      "user": {
        "id": "user_id",
        "username": "john_doe",
        "name": "John Doe"
      },
      "since": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 10
}
```

---

### 1.4 Get Following
**Endpoint:** `GET /following/:userId`

**Mô tả:** Lấy danh sách users mà user này đang follow

---

### 1.5 Check Follow Status
**Endpoint:** `GET /check/:followerId/:followeeId`

**Mô tả:** Kiểm tra xem user A có đang follow user B không

**Response:**
```json
{
  "message": "Kiểm tra follow status thành công",
  "data": {
    "isFollowing": true,
    "followerId": "user_id_1",
    "followeeId": "user_id_2"
  }
}
```

---

### 1.6 Get User Stats
**Endpoint:** `GET /stats/:userId`

**Mô tả:** Thống kê số followers và following của user

**Response:**
```json
{
  "message": "Lấy user stats thành công",
  "data": {
    "followersCount": 150,
    "followingCount": 200
  }
}
```

---

### 1.7 Get Mutual Friends
**Endpoint:** `GET /mutual/:userId1/:userId2`

**Mô tả:** Lấy danh sách bạn chung (users mà cả 2 đều follow)

---

## 2. FRIEND SUGGESTIONS - Gợi ý kết nối

### 2.1 Smart Suggestions (Recommended)
**Endpoint:** `GET /suggestions/:userId?limit=10`

**Mô tả:** Gợi ý users dựa trên:
- Bạn chung (mutual following)
- Độ phổ biến (popularity)
- Tính điểm: `score = mutualFollowing * 2 + popularity`

**Query Parameters:**
- `limit` (optional): Số lượng gợi ý tối đa (default: 10)

**Response:**
```json
{
  "message": "Lấy gợi ý kết nối thành công",
  "data": [
    {
      "user": {
        "id": "suggested_user_id",
        "username": "jane_smith",
        "name": "Jane Smith"
      },
      "mutualFollowing": 5,
      "popularity": 120,
      "score": 130
    }
  ],
  "total": 10
}
```

**Use Case:**
- Feature "People you may know"
- Gợi ý trong sidebar
- Notifications "5 friends follow this person"

---

### 2.2 Suggestions by Common Followers
**Endpoint:** `GET /suggestions/by-followers/:userId?limit=10`

**Mô tả:** Gợi ý users có cùng followers (similar audience)

**Response:**
```json
{
  "message": "Lấy gợi ý dựa trên followers chung thành công",
  "data": [
    {
      "user": {...},
      "commonFollowers": 8,
      "totalFollowers": 200
    }
  ]
}
```

**Use Case:**
- Gợi ý creators/influencers có audience tương tự
- Tìm accounts có chủ đề liên quan

---

### 2.3 Extended Network Suggestions
**Endpoint:** `GET /suggestions/extended/:userId?limit=10`

**Mô tả:** Gợi ý users trong vòng 2-3 bước (friends of friends of friends)

**Response:**
```json
{
  "data": [
    {
      "user": {...},
      "distance": 2,
      "pathCount": 3,
      "popularity": 150
    }
  ]
}
```

**Use Case:**
- Mở rộng mạng lưới xa hơn
- Tìm connections gián tiếp
- "You might know from ..."

---

## 3. NETWORK ANALYSIS - Phân tích mạng

### 3.1 Influence Score
**Endpoint:** `GET /influence?limit=20`

**Mô tả:** Xếp hạng users có ảnh hưởng cao nhất

**Công thức:** `influenceScore = followers / following`

**Response:**
```json
{
  "message": "Lấy danh sách influencers thành công",
  "data": [
    {
      "user": {
        "id": "user_id",
        "username": "influencer",
        "name": "Big Influencer"
      },
      "followers": 5000,
      "following": 100,
      "influenceScore": 50.0
    }
  ]
}
```

**Use Case:**
- Tìm influencers trong platform
- Verified badge criteria
- Marketing campaigns
- Featured users

---

### 3.2 Centrality Analysis
**Endpoint:** `GET /centrality?limit=20`

**Mô tả:** Tính degree centrality (tổng số connections)

**Response:**
```json
{
  "data": [
    {
      "user": {...},
      "totalConnections": 250
    }
  ]
}
```

**Use Case:**
- Tìm users có nhiều connections nhất
- Network hubs
- Community leaders

---

### 3.3 Shortest Path
**Endpoint:** `GET /path/:userId1/:userId2`

**Mô tả:** Tìm đường kết nối ngắn nhất giữa 2 users (degrees of separation)

**Response:**
```json
{
  "message": "Tìm đường đi thành công",
  "data": {
    "distance": 3,
    "usernames": ["user1", "user2", "user3", "user4"],
    "connected": true
  }
}
```

**Use Case:**
- "You and John are connected through 3 people"
- LinkedIn-style connection path
- Social graph visualization

---

### 3.4 User Network Analysis
**Endpoint:** `GET /user-network/:userId?depth=2`

**Mô tả:** Phân tích mạng của 1 user trong phạm vi N bước

**Query Parameters:**
- `depth` (optional): Độ sâu phân tích (default: 2)

**Response:**
```json
{
  "message": "Lấy user network thành công",
  "data": {
    "user": {...},
    "connectedUsers": [...],
    "edges": [
      {"from": "id1", "to": "id2", "type": "FOLLOWS"}
    ],
    "stats": {
      "totalConnections": 50,
      "totalEdges": 120,
      "depth": 2
    }
  }
}
```

**Use Case:**
- Network visualization
- Understanding user's social circle
- Privacy/reach settings

---

### 3.5 Network Visualization
**Endpoint:** `GET /network`

**Mô tả:** Lấy toàn bộ network data cho visualization

**Response:**
```json
{
  "message": "Lấy network data thành công",
  "data": {
    "nodes": [
      {"id": "user_id", "name": "User Name", "username": "username"}
    ],
    "links": [
      {"source": "id1", "target": "id2", "type": "FOLLOWS", "since": "..."}
    ]
  },
  "stats": {
    "nodes": 100,
    "links": 450
  }
}
```

**Use Case:**
- D3.js network graph
- Force-directed graph visualization
- Admin dashboard analytics

---

## 4. COMMUNITY DETECTION - Phát hiện cộng đồng

### 4.1 Find Communities
**Endpoint:** `GET /communities?minSize=3`

**Mô tả:** Tìm các nhóm users có kết nối chặt chẽ (clusters)

**Query Parameters:**
- `minSize` (optional): Kích thước tối thiểu của cluster (default: 3)

**Response:**
```json
{
  "message": "Phát hiện cộng đồng thành công",
  "data": [
    {
      "id": 1,
      "members": [...],
      "size": 15
    }
  ],
  "total": 5
}
```

**Use Case:**
- Phân tích communities/groups
- Targeted content/ads
- Community management
- Understanding platform structure

---

### 4.2 Find Cliques
**Endpoint:** `GET /cliques?minSize=3`

**Mô tả:** Tìm các cliques (nhóm users follow lẫn nhau - triangular relationships)

**Response:**
```json
{
  "message": "Tìm cliques thành công",
  "data": [
    {
      "id": 1,
      "members": [
        {"id": "u1", "username": "user1"},
        {"id": "u2", "username": "user2"},
        {"id": "u3", "username": "user3"}
      ],
      "size": 3,
      "type": "triangular_clique"
    }
  ]
}
```

**Use Case:**
- Tìm nhóm bạn thân
- Close-knit communities
- Trust circles
- Group suggestions

---

### 4.3 Bridge Users
**Endpoint:** `GET /bridges`

**Mô tả:** Tìm users làm cầu nối giữa các cộng đồng khác nhau

**Response:**
```json
{
  "message": "Tìm bridge users thành công",
  "data": [
    {
      "user": {...},
      "totalConnections": 50,
      "bridgeScore": 120
    }
  ]
}
```

**Use Case:**
- Tìm connectors/networkers
- Community integrators
- Information spreaders
- Marketing ambassadors

---

### 4.4 Network Density
**Endpoint:** `GET /network-density`

**Mô tả:** Phân tích mật độ kết nối của toàn bộ network

**Response:**
```json
{
  "message": "Phân tích mật độ network thành công",
  "data": {
    "totalUsers": 500,
    "totalRelationships": 2500,
    "density": 0.0204,
    "avgConnectionsPerUser": 5.0
  }
}
```

**Công thức:**
- Density = `totalRelationships / (totalUsers * (totalUsers - 1))`
- Avg Connections = `totalRelationships / totalUsers`

**Use Case:**
- Platform health metrics
- Growth tracking
- Engagement analysis
- A/B testing impact

---

## 5. USE CASES THỰC TẾ

### 5.1 Feed Personalization
```javascript
// Lấy posts từ những người user follow
GET /api/relationships/following-ids/:userId

// Sau đó query posts từ MongoDB với user IDs này
```

### 5.2 "People You May Know" Feature
```javascript
// Gợi ý thông minh kết hợp nhiều yếu tố
GET /api/relationships/suggestions/:userId?limit=5

// Hiển thị với context: "5 mutual friends"
```

### 5.3 User Profile - Social Stats
```javascript
// Hiển thị followers/following count
GET /api/relationships/stats/:userId

// Button "Follow" / "Following"
GET /api/relationships/check/:currentUserId/:profileUserId
```

### 5.4 Network Visualization Dashboard
```javascript
// Admin dashboard - visualize toàn bộ network
GET /api/relationships/network

// Render bằng D3.js force-directed graph
```

### 5.5 Influencer Discovery
```javascript
// Marketing team tìm influencers
GET /api/relationships/influence?limit=50

// Filter theo niche/topic từ user profile
```

### 5.6 Community Management
```javascript
// Phát hiện các communities trong platform
GET /api/relationships/communities?minSize=10

// Tạo groups/channels cho từng community
```

### 5.7 Connection Request
```javascript
// Hiển thị mutual friends khi gửi friend request
GET /api/relationships/mutual/:userId1/:userId2

// "You and John have 12 mutual friends"
```

### 5.8 Trust & Safety
```javascript
// Phát hiện suspicious patterns
GET /api/relationships/bridges  // Users kết nối nhiều communities
GET /api/relationships/influence  // Sudden high influence = bot?

// Analyze centrality để phát hiện spam networks
GET /api/relationships/centrality
```

---

## 6. PERFORMANCE OPTIMIZATION

### 6.1 Indexes
Neo4j tự động tạo các indexes sau:
- `user_id_unique` - UNIQUE constraint trên User.id
- `user_email_index` - Index trên User.email
- `user_username_index` - Index trên User.username

### 6.2 Query Optimization Tips

1. **Sử dụng MERGE thay vì CREATE** để tránh duplicates
2. **Limit results** bằng LIMIT clause
3. **Filter sớm** với WHERE clause
4. **Cache kết quả** cho các queries chạy thường xuyên
5. **Pagination** cho danh sách lớn

### 6.3 Caching Strategy
```javascript
// Cache suggestions trong 1 giờ
GET /api/relationships/suggestions/:userId
// Redis: key = `suggestions:${userId}`, TTL = 3600s

// Cache influence rankings trong 1 ngày
GET /api/relationships/influence
// Redis: key = `influence:rankings`, TTL = 86400s
```

---

## 7. ERROR HANDLING

### Common Error Responses

**404 Not Found:**
```json
{
  "message": "Không tìm thấy user để follow"
}
```

**400 Bad Request:**
```json
{
  "message": "followerId và followeeId là bắt buộc"
}
```

**403 Forbidden:**
```json
{
  "message": "Admin không được follow user. Chỉ user mới có thể follow."
}
```

**500 Internal Server Error:**
```json
{
  "message": "Lỗi khi follow user",
  "error": "Detailed error message"
}
```

---

## 8. TESTING

### Sample Test Cases

```javascript
// Test 1: Follow user
POST /api/relationships/follow
Body: { followerId: "1", followeeId: "2" }
Expected: 200 OK

// Test 2: Duplicate follow (should be idempotent)
POST /api/relationships/follow
Body: { followerId: "1", followeeId: "2" }
Expected: 200 OK (không tạo duplicate)

// Test 3: Admin cannot follow
POST /api/relationships/follow
Body: { followerId: "admin_id", followeeId: "2" }
Expected: 403 Forbidden

// Test 4: Get suggestions
GET /api/relationships/suggestions/1?limit=5
Expected: Array of 5 suggested users

// Test 5: Network density
GET /api/relationships/network-density
Expected: Object with density metrics
```

---

## 9. MONITORING & ANALYTICS

### Key Metrics to Track

1. **Network Growth**
   - Total relationships per day
   - New follows per hour
   - Unfollow rate

2. **Engagement**
   - Average connections per user
   - Network density over time
   - Active users percentage

3. **Feature Usage**
   - Suggestions click-through rate
   - Follow conversion from suggestions
   - Network visualization views

4. **Performance**
   - Query response times
   - Neo4j memory usage
   - Connection pool utilization

---

## 10. FUTURE ENHANCEMENTS

### Planned Features

1. **Advanced Recommendations**
   - Machine learning-based suggestions
   - Interest-based matching
   - Collaborative filtering

2. **Real-time Updates**
   - WebSocket notifications for new followers
   - Live network graph updates
   - Real-time feed with GraphQL subscriptions

3. **Advanced Analytics**
   - PageRank implementation
   - Betweenness centrality calculation
   - Community detection với Louvain algorithm

4. **Privacy Controls**
   - Private accounts
   - Follow request approval
   - Hidden connections

5. **Relationship Types**
   - BLOCKS relationship
   - MUTES relationship
   - CLOSE_FRIENDS group

---

## Resources

- **Neo4j Cypher Manual:** https://neo4j.com/docs/cypher-manual/
- **Neo4j Driver Docs:** https://neo4j.com/docs/javascript-manual/
- **Sample Queries:** `/docs/neo4j/sample-queries.cypher`
- **Setup Guide:** `/docs/neo4j/Neo4j-setup.md`

---

## Support

For technical support or feature requests, please contact the development team.

**Last Updated:** November 2025
**Version:** 1.0.0
