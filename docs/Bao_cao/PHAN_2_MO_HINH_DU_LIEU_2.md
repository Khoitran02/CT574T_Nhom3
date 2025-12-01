Collecting workspace information# PHẦN 2: MÔ HÌNH DỮ LIỆU

## 2.1. Chiến lược Thiết kế trên MongoDB

### 2.1.1. Lựa chọn MongoDB trong Kiến trúc Hybrid

Trong kiến trúc hệ thống, MongoDB được lựa chọn để quản lý dữ liệu phi cấu trúc và bán cấu trúc của người dùng, bài viết, và tương tác xã hội. Quyết định này dựa trên các yếu tố kỹ thuật sau:

**Tính linh hoạt của Schema:** MongoDB cho phép lưu trữ các tài liệu (documents) có cấu trúc khác nhau trong cùng một collection, đáp ứng nhu cầu mở rộng các thuộc tính người dùng hoặc nội dung bài viết mà không cần migration phức tạp.

**Khả năng mở rộng ngang:** Sharding tự nhiên của MongoDB hỗ trợ phân tán dữ liệu khi lượng người dùng và bài viết tăng trưởng theo cấp số nhân.

**Hiệu năng truy vấn đơn lẻ:** Với các thao tác CRUD trên từng bài viết hoặc hồ sơ người dùng, MongoDB cung cấp độ trễ thấp nhờ việc lưu trữ dữ liệu liền kề trên đĩa (data locality).

### 2.1.2. Thiết kế User Collection

Collection `users` lưu trữ thông tin định danh và xác thực của người dùng với cấu trúc tối ưu:

```javascript
// Pseudo-code: User Document Structure
{
  _id: ObjectId,
  username: String (unique, indexed),
  email: String (unique, indexed),
  passwordHash: String,
  role: Enum["user", "admin"],
  profile: { bio, avatar, ... }
}
```

**Chiến lược Indexing:** Hai chỉ mục duy nhất (unique index) được tạo trên trường `username` và `email` nhằm:
- Đảm bảo tính toàn vẹn dữ liệu ở tầng cơ sở dữ liệu, ngăn chặn trùng lặp tài khoản.
- Tối ưu hóa các truy vấn đăng nhập và tìm kiếm người dùng với độ phức tạp O(log n).

**Quản lý Role-Based Access Control (RBAC):** Trường `role` cho phép phân quyền động tại tầng middleware của backend, giảm thiểu logic phức tạp trong code.

### 2.1.3. Thiết kế Post & Comment: Chiến lược Referencing

#### Kỹ thuật Tham chiếu (Referencing)

Dựa trên phân tích `comments.model.js`, hệ thống áp dụng mô hình **tách biệt** giữa Post và Comment:

```javascript
// Pseudo-code: Post Collection
{
  _id: ObjectId,
  authorId: ObjectId (ref: "User"),
  content: String,
  createdAt: Date
  // Không chứa mảng comments
}

// Pseudo-code: Comment Collection
{
  _id: ObjectId,
  postId: ObjectId (ref: "Post"),
  authorId: ObjectId (ref: "User"),
  text: String,
  createdAt: Date
}
```

#### Biện luận Kỹ thuật: Tại sao không sử dụng Embedding?

**Giới hạn BSON Document Size:** Mỗi document trong MongoDB có kích thước tối đa 16MB. Nếu nhúng toàn bộ comments vào Post, một bài viết viral với hàng chục ngàn bình luận sẽ vượt quá ngưỡng này, gây ra lỗi hệ thống nghiêm trọng.

**Hiệu năng Cập nhật:** Khi sử dụng embedding, mỗi comment mới đều yêu cầu cập nhật (update) document Post. Với tần suất tương tác cao, điều này gây:
- Lock contention trên document Post.
- Phát sinh nhiều write operations, làm giảm throughput của hệ thống.

**Tối ưu Phân trang:** Truy vấn comments với Referencing cho phép áp dụng `skip()` và `limit()` hiệu quả, trong khi Embedding đòi hỏi load toàn bộ Post document và xử lý phân trang ở tầng application.

**Khả năng Mở rộng:** Referencing hỗ trợ các tính năng phức tạp như:
- Nested comments (reply to reply).
- Soft delete comments mà không ảnh hưởng Post.
- Truy vấn riêng biệt comments của một user trên toàn hệ thống.

#### So sánh Embedding vs Referencing

| **Tiêu chí**              | **Embedding**                          | **Referencing** (Đã chọn)           |
|---------------------------|----------------------------------------|-------------------------------------|
| **Đọc dữ liệu**           | 1 truy vấn (tất cả trong Post)         | 2 truy vấn (Post + Comments)        |
| **Ghi dữ liệu**           | Cập nhật Post mỗi lần comment          | Thêm document mới vào Collection    |
| **Giới hạn kích thước**   | Bị giới hạn 16MB                       | Không giới hạn số lượng comments    |
| **Phân trang**            | Phức tạp (load toàn bộ rồi slice)      | Hiệu quả (query trực tiếp DB)       |
| **Use case phù hợp**      | Dữ liệu ít thay đổi, số lượng nhỏ      | Dữ liệu động, số lượng lớn          |

**Kết luận:** Trong ngữ cảnh mạng xã hội với tương tác cao, Referencing là lựa chọn tối ưu để đảm bảo khả năng mở rộng và hiệu năng dài hạn.

## 2.2. Mô hình Đồ thị trên Neo4j

### 2.2.1. Thiết kế Nodes và Relationships

Neo4j được tích hợp để quản lý đồ thị mạng xã hội, nơi các mối quan hệ giữa người dùng là trọng tâm của nhiều tính năng.

**Node `User`:** Mỗi người dùng được biểu diễn như một node với các thuộc tính:
```cypher
// Pseudo-code: Cypher Node Structure
(u:User {
  userId: String (from MongoDB _id),
  username: String,
  createdAt: DateTime
})
```

**Relationship `FOLLOWS`:** Quan hệ follow có hướng (directed) biểu diễn việc người dùng theo dõi nhau:
```cypher
// Pseudo-code: Relationship Pattern
(userA:User)-[:FOLLOWS {since: DateTime}]->(userB:User)
```

**Ý nghĩa Kỹ thuật:** 
- Relationship có hướng cho phép phân biệt "follower" và "following".
- Thuộc tính `since` trên edge hỗ trợ các truy vấn phân tích theo thời gian (temporal queries).

### 2.2.2. Quy trình Đồng bộ Dữ liệu

Dữ liệu giữa MongoDB và Neo4j được đồng bộ theo quy trình sau:

**Giai đoạn 1 - Đăng ký User:**
1. API backend nhận request đăng ký từ `frontend/src/api/api.js`.
2. Tạo document trong MongoDB `users` collection.
3. Sau khi MongoDB xác nhận ghi thành công (acknowledged write), trigger tạo Node tương ứng tại Neo4j với `userId` làm khóa tham chiếu.

**Giai đoạn 2 - Tạo Quan hệ:**
1. Khi User A thực hiện "Follow" User B qua API.
2. Backend tạo Relationship `(:User {userId: A})-[:FOLLOWS]->(:User {userId: B})` trong Neo4j.
3. Không lưu trữ thông tin này trong MongoDB, tuân thủ nguyên tắc Single Source of Truth cho từng loại dữ liệu.

**Xử lý Đồng bộ Thất bại:** Áp dụng pattern **Eventual Consistency**:
- Nếu ghi vào Neo4j thất bại, log sự kiện vào logs.
- Background job định kỳ reconcile dữ liệu dựa trên audit log.

### 2.2.3. Lợi thế của Truy vấn Đồ thị

So với các giải pháp truy vấn quan hệ trên MongoDB, Neo4j cung cấp các ưu điểm vượt trội:

**Tìm Bạn Chung (Mutual Friends):**
- **MongoDB approach:** Cần 3-4 lần `$lookup` lồng nhau để tìm intersection của hai mảng following, độ phức tạp O(n²).
- **Neo4j approach:** 
```cypher
// Pseudo-code: Mutual Friends Query
MATCH (me:User)-[:FOLLOWS]->(mutual)<-[:FOLLOWS]-(friend:User)
WHERE me.userId = $myId AND friend.userId = $friendId
RETURN mutual
```
Độ phức tạp O(d²) với d là average degree, thường d << n trong social graph.

**Gợi ý Kết bạn (Friend Recommendation):**
- **MongoDB:** Không có cơ chế native để tính "bạn của bạn" hiệu quả, đòi hỏi xử lý ở application layer.
- **Neo4j:** Sử dụng thuật toán graph traversal với độ sâu 2-3 hops:
```cypher
// Pseudo-code: Recommendation
MATCH (me:User)-[:FOLLOWS*2..3]-(suggested:User)
WHERE NOT (me)-[:FOLLOWS]->(suggested)
RETURN suggested, count(*) as commonConnections
ORDER BY commonConnections DESC
```

**Phân tích Network Topology:** Neo4j hỗ trợ các thuật toán graph native như:
- PageRank: Xác định influencer trong mạng.
- Community Detection: Phát hiện các nhóm user có liên kết chặt chẽ.
- Shortest Path: Tính degree of separation giữa hai user bất kỳ.

**Kết luận Kiến trúc Hybrid:** Việc phân chia trách nhiệm - MongoDB xử lý dữ liệu transactional, Neo4j quản lý đồ thị quan hệ - tạo nên một hệ thống vừa linh hoạt vừa hiệu năng cao, tận dụng thế mạnh của từng công nghệ cơ sở dữ liệu.