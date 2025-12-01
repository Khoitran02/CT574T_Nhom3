bqthangdev: @workspace Hãy đóng vai trò là một Kỹ sư Dữ liệu và Nghiên cứu viên. Hãy viết nội dung cho file báo cáo `PHAN_2_MO_HINH_DU_LIEU.md`.

**Nguồn tham khảo (Context):**
1.  **MongoDB Models:** Đọc kỹ `backend/models/users.model.js`, `posts.model.js`, `comments.model.js`.
2.  **Neo4j Config:** Đọc `backend/config/neo4j.js` và `backend/scripts/setup-sharding.js`.
3.  **API Logic:** Đọc `frontend/src/api/api.js`.

**Yêu cầu đầu ra:**
- **Định dạng:** Markdown (`.md`) hoàn chỉnh.
- **Văn phong:** Học thuật, khách quan, rõ ràng (Tiếng Việt).
- **Cấu trúc:**

# PHẦN 2. MÔ HÌNH DỮ LIỆU

## 2.1. Thiết kế Schema trên MongoDB (Document Store)
- **Mô hình Hybrid:** Giải thích việc sử dụng MongoDB để lưu trữ dữ liệu tĩnh (Hồ sơ, Bài viết) và nội dung lớn.
- **User Schema:** Phân tích các trường quan trọng từ `users.model.js`. Giải thích tại sao `username` và `email` có index `unique`.
- **Post & Comment:** - Phân tích `postSchema`. 
  - **Quan trọng:** Dựa trên `comments.model.js`, hãy làm rõ rằng hệ thống sử dụng **Mô hình Tham chiếu (Referencing)** thay vì Nhúng (Embedding). Comment được lưu ở collection riêng và liên kết qua `postId`. Giải thích lý do chọn cách này (ví dụ: tránh giới hạn 16MB của document, hỗ trợ phân trang comment tốt hơn).
- **Minh họa:** Tạo các block code JSON mẫu đại diện cho 1 User, 1 Post và 1 Comment dựa trên code đã đọc.

## 2.2. Thiết kế Đồ thị trên Neo4j (Graph Database)
- **Nodes (Nút):** Xác định node `User` (dựa trên `create-test-user.js`).
- **Relationships (Cạnh):** Xác định quan hệ `FOLLOWS` (dựa trên `TESTING_QUERIES.md`).
- **Đồng bộ dữ liệu:** Giải thích logic: Khi tạo User bên MongoDB, hệ thống đồng bộ ID sang Neo4j để phục vụ các truy vấn đồ thị phức tạp như "Gợi ý bạn bè" (Friend Recommendation) mà MongoDB xử lý kém hiệu quả hơn.

**Lưu ý:** Chỉ xuất ra nội dung file markdown, không cần lời dẫn.

Workspace: Collecting workspace information# PHẦN 2. MÔ HÌNH DỮ LIỆU

## 2.1. Thiết kế Schema trên MongoDB (Document Store)

### 2.1.1. Mô hình Hybrid

Hệ thống áp dụng kiến trúc **Polyglot Persistence** với MongoDB đóng vai trò lưu trữ chính cho dữ liệu tĩnh và nội dung có kích thước lớn. MongoDB được lựa chọn cho các đối tượng như hồ sơ người dùng (User Profile), bài viết (Posts) và bình luận (Comments) nhờ các ưu điểm:

- **Linh hoạt về schema:** Cho phép mở rộng thuộc tính mà không cần migration phức tạp.
- **Hiệu năng đọc cao:** Tối ưu cho các truy vấn đơn giản (CRUD operations) trên document.
- **Khả năng mở rộng ngang:** Hỗ trợ sharding để phân tán dữ liệu khi hệ thống tăng trưởng.

Trong khi đó, các quan hệ xã hội phức tạp (follow/friend relationships) được lưu trữ trên Neo4j để tận dụng khả năng truy vấn đồ thị hiệu quả.

### 2.1.2. User Schema

Dựa trên users.model.js, schema người dùng được thiết kế như sau:

```javascript
{
  _id: ObjectId,
  username: String,    // unique, required
  email: String,       // unique, required
  password: String,    // hashed
  fullName: String,
  bio: String,
  avatarUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Phân tích các trường quan trọng:**

- **`username` và `email` với index `unique`:** Đảm bảo tính duy nhất của định danh người dùng trong hệ thống. Index này phục vụ hai mục đích:
  - **Tính toàn vẹn dữ liệu (Data Integrity):** Ngăn chặn việc tạo nhiều tài khoản với cùng username/email.
  - **Hiệu năng truy vấn:** Tối ưu hóa các thao tác đăng nhập và tìm kiếm người dùng (O(log n) thay vì O(n)).

- **`password`:** Được mã hóa bằng bcrypt trước khi lưu trữ, tuân thủ best practice về bảo mật.

- **Metadata timestamps:** `createdAt` và `updatedAt` tự động cập nhật bởi Mongoose để theo dõi vòng đời của document.

### 2.1.3. Post & Comment Schema

#### Post Schema

Dựa trên posts.model.js, cấu trúc bài viết:

```javascript
{
  _id: ObjectId,
  userId: ObjectId,        // ref to User
  content: String,
  imageUrl: String,
  likesCount: Number,
  commentsCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Đặc điểm thiết kế:**
- **`userId` (Foreign Key):** Tham chiếu đến collection `users`, tạo quan hệ 1-N giữa User và Posts.
- **Denormalization:** Các trường `likesCount` và `commentsCount` được lưu trực tiếp để tối ưu hiệu năng đọc, tránh phải đếm document con mỗi lần hiển thị.

#### Comment Schema và Mô hình Tham chiếu

**Quan trọng:** Hệ thống sử dụng **Mô hình Tham chiếu (Referencing)** thay vì Nhúng (Embedding) cho Comments. Dựa trên comments.model.js, Comment được lưu trong collection riêng biệt:

```javascript
{
  _id: ObjectId,
  postId: ObjectId,        // ref to Post
  userId: ObjectId,        // ref to User
  content: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Lý do chọn mô hình Referencing:**

1. **Tránh giới hạn kích thước document:** MongoDB có giới hạn 16MB/document. Nếu nhúng (embedding) tất cả comments vào post, các bài viết viral với hàng nghìn comment sẽ vượt ngưỡng này.

2. **Hiệu năng phân trang:** Việc phân trang comments nhúng trong MongoDB rất kém hiệu quả (phải load toàn bộ document rồi mới slice). Với collection riêng, có thể sử dụng `skip()` và `limit()` hiệu quả.

3. **Tính mô-đun:** Dễ dàng thêm các tính năng như nested comments (replies), reactions trên comments mà không làm phức tạp post document.

4. **Cập nhật đồng thời:** Nhiều user comment cùng lúc sẽ gây write conflict nếu dùng embedding. Referencing cho phép các write operation độc lập.

### 2.1.4. Minh họa Schema với dữ liệu mẫu

**User Document:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "john_doe",
  "email": "john.doe@example.com",
  "password": "$2b$10$N9qo8uLOickgx2ZMRZoMye...",
  "fullName": "John Doe",
  "bio": "Software Engineer | Travel Enthusiast",
  "avatarUrl": "https://cdn.example.com/avatars/john_doe.jpg",
  "createdAt": "2024-01-15T08:30:00.000Z",
  "updatedAt": "2024-01-20T14:22:00.000Z"
}
```

**Post Document:**
```json
{
  "_id": "507f1f77bcf86cd799439022",
  "userId": "507f1f77bcf86cd799439011",
  "content": "Exploring the beauty of graph databases! #Neo4j #MongoDB",
  "imageUrl": "https://cdn.example.com/posts/graph-db.jpg",
  "likesCount": 42,
  "commentsCount": 8,
  "createdAt": "2024-01-20T10:15:00.000Z",
  "updatedAt": "2024-01-20T16:45:00.000Z"
}
```

**Comment Document:**
```json
{
  "_id": "507f1f77bcf86cd799439033",
  "postId": "507f1f77bcf86cd799439022",
  "userId": "507f1f77bcf86cd799439012",
  "content": "Great insights! Have you tried modeling social graphs in Neo4j?",
  "createdAt": "2024-01-20T11:30:00.000Z",
  "updatedAt": "2024-01-20T11:30:00.000Z"
}
```

## 2.2. Thiết kế Đồ thị trên Neo4j (Graph Database)

### 2.2.1. Nodes (Nút)

Dựa trên create-test-user.js và neo4j.js, hệ thống định nghĩa node `User` trong Neo4j với cấu trúc:

```cypher
(:User {
  userId: String,      // MongoDB _id as string
  username: String,
  createdAt: DateTime
})
```

**Lưu ý thiết kế:**
- **`userId`:** Khóa ngoại tương ứng với `_id` trong MongoDB, đóng vai trò bridge giữa hai cơ sở dữ liệu.
- **Minimal properties:** Neo4j chỉ lưu các thuộc tính cần thiết cho truy vấn đồ thị (username để hiển thị). Các thông tin chi tiết khác (email, bio, avatar) được giữ trong MongoDB để tránh data duplication.

### 2.2.2. Relationships (Cạnh)

Dựa trên TESTING_QUERIES.md, hệ thống sử dụng relationship `FOLLOWS` để mô hình hóa mạng lưới xã hội:

```cypher
(:User)-[:FOLLOWS {
  createdAt: DateTime
}]->(:User)
```

**Đặc điểm:**
- **Directed Relationship:** Quan hệ một chiều, phản ánh bản chất của "follow" trong mạng xã hội (A follow B không có nghĩa B follow A).
- **Timestamp:** Thuộc tính `createdAt` trên edge cho phép phân tích temporal dynamics (ai follow ai khi nào).

**Ví dụ truy vấn:**

```cypher
// Tìm tất cả người mà user A đang follow
MATCH (a:User {userId: "507f1f77bcf86cd799439011"})-[:FOLLOWS]->(b:User)
RETURN b.username, b.userId

// Tìm followers của user B
MATCH (a:User)-[:FOLLOWS]->(b:User {userId: "507f1f77bcf86cd799439022"})
RETURN a.username, a.userId
```

### 2.2.3. Đồng bộ dữ liệu giữa MongoDB và Neo4j

**Quy trình đồng bộ:**

1. **Khi tạo User mới:** 
   - Bước 1: Lưu document đầy đủ vào MongoDB collection `users`.
   - Bước 2: Trigger đồng bộ sang Neo4j, tạo node `User` với `userId` tương ứng.

2. **Khi tạo quan hệ Follow:**
   - Bước 1: API endpoint nhận request follow từ frontend (xem `frontend/src/api/api.js`).
   - Bước 2: Backend tạo relationship `FOLLOWS` trực tiếp trong Neo4j.
   - Bước 3: (Tùy chọn) Cập nhật metadata trong MongoDB nếu cần (ví dụ: tăng counter `followingCount`).

**Lý do thiết kế Hybrid:**

- **MongoDB:** Xử lý tốt các truy vấn đơn giản như "Lấy thông tin user với ID", "Lấy 20 bài post mới nhất".

- **Neo4j:** Vượt trội trong các truy vấn đồ thị phức tạp:
  - **Friend Recommendation:** "Gợi ý bạn bè của bạn bè" (friends-of-friends).
  ```cypher
  MATCH (me:User {userId: $myId})-[:FOLLOWS]->(:User)-[:FOLLOWS]->(suggestion:User)
  WHERE NOT (me)-[:FOLLOWS]->(suggestion) AND me <> suggestion
  RETURN suggestion.username, COUNT(*) AS mutualFriends
  ORDER BY mutualFriends DESC
  LIMIT 10
  ```
  
  - **Shortest Path:** Tìm chuỗi kết nối ngắn nhất giữa hai user.
  ```cypher
  MATCH path = shortestPath(
    (a:User {userId: $user1})-[:FOLLOWS*]-(b:User {userId: $user2})
  )
  RETURN path
  ```

  - **Community Detection:** Phát hiện các nhóm người dùng có kết nối chặt chẽ bằng thuật toán Louvain/Label Propagation.

Cách tiếp cận này tối ưu hóa cả **chi phí lưu trữ** (MongoDB rẻ hơn cho dữ liệu lớn) và **hiệu năng truy vấn** (Neo4j nhanh hơn cho graph traversal), đồng thời duy trì **consistency** thông qua việc đồng bộ có kiểm soát.