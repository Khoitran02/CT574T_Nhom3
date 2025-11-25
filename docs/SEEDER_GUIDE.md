# Database Seeder - Hướng Dẫn Sử Dụng

Tài liệu này hướng dẫn cách sử dụng các seeder scripts để tạo dữ liệu test cho hệ thống.

## Tổng Quan

Hệ thống có **4 seeder scripts** với quy mô khác nhau:

| Seeder | Users | Posts/User | Total Posts | Relationships | Time | Use Case |
|--------|-------|------------|-------------|---------------|------|----------|
| **Demo** | 10 | 10 | 100 | ~25 | 1-2s | Quick verification |
| **Quick** | 100 | 50 | 5,000 | ~500-1K | 15-30s | Development |
| **Large** | 5,000 | 2,000 | 10,000,000 | ~150K | 30-60m | Load testing |
| **Clean** | - | - | - | - | 5-10s | Database cleanup |

### Default Credentials

**Tất cả seeded users:**
- Username: `user1`, `user2`, ..., `userN`
- Email: `user1@example.com`, `user2@example.com`, ...
- Password: **`password123`**

⚠️ **Chỉ dùng cho development/testing!**

---

## Quick Start

### Commands

```bash
# 1. Test setup (khuyến nghị chạy đầu tiên)
cd backend
npm run seed:demo

# 2. Development data
npm run seed:quick

# 3. Production-scale data (grab coffee ☕)
npm run seed:large

# 4. Clean everything
npm run seed:clean
```

### First Time Setup

```bash
# Bước 1: Verify databases đang chạy
npm run test-mongodb
npm run test-neo4j

# Bước 2: Chạy demo seeder
npm run seed:demo

# Bước 3: Kiểm tra data trong Neo4j Browser
# Mở: http://localhost:7474

# Bước 4: Start development server
npm run dev
```

---

## Chi Tiết Các Seeder

### 1. Demo Seeder - Verification

```bash
npm run seed:demo
```

**Thông tin:**
- 👥 10 users
- 📝 100 posts (10 posts/user)
- 🔗 ~25 follow relationships
- ⏱️ 1-2 giây

**Script:** `backend/scripts/seed-demo.js`

---

### 2. Quick Seeder - Development

```bash
npm run seed:quick
```

**Thông tin:**
- 👥 100 users
- 📝 5,000 posts (50 posts/user)
- 🔗 500-1,000 follow relationships
- ⏱️ 15-30 giây

**Script:** `backend/scripts/seed-quick.js`

---

### 3. Large Seeder - Production Testing

```bash
npm run seed:large
```

**Thông tin:**
- 👥 5,000 users
- 📝 10,000,000 posts (2,000 posts/user)
- 🔗 ~150,000 follow relationships
- ⏱️ 30-60 phút

**Yêu cầu hệ thống:**
- RAM: ≥4GB free
- Disk: ≥5GB free
- CPU: Multi-core recommended
- Storage: SSD recommended

**Script:** `backend/scripts/seed-large-dataset.js`

---

### 4. Clean Database

```bash
npm run seed:clean
```

**⚠️ WARNING:** Xóa **TẤT CẢ** dữ liệu!

**Confirmation steps:**
1. Type "yes" để confirm
2. Type "DELETE ALL DATA" để double-confirm

**Xóa:**
- ✅ All MongoDB collections (users, posts, comments)
- ✅ All Neo4j nodes và relationships
- ✅ Cannot be undone!

**Script:** `backend/scripts/clean-database.js`

---

## Workflows Khuyến Nghị

### Workflow 1: First Time Setup

```bash
# Bước 1: Verify databases
npm run test-mongodb
npm run test-neo4j

# Bước 2: Chạy demo
npm run seed:demo

# Bước 3: Kiểm tra trong Neo4j Browser
# Open: http://localhost:7474

# Bước 4: Start server
npm run dev
```

---

### Workflow 2: Daily Development

```bash
# Clean old data
npm run seed:clean

# Load fresh development data
npm run seed:quick

# Start server
npm run dev
```

---

### Workflow 3: Load Testing

```bash
# Clean database
npm run seed:clean

# Load large dataset (30-60 minutes)
npm run seed:large

# Run your performance tests
# Monitor MongoDB & Neo4j metrics
```

---

## Data Overview

### Users

**Thông tin được tạo:**
- Usernames: `firstname_lastname###`
- Emails: `firstname_lastname###@example.com`
- Password: `password123` (bcrypt hashed)
- Names: Random từ 30 first names × 30 last names = 900 combinations
- Bios: Varied topics (Tech, Science, Travel, Food, etc.)
- Avatars: Generated from pravatar.cc
- Role: `user` (admin không được seed)

**Lưu trữ:**
- MongoDB: `users` collection
- Neo4j: `User` nodes với properties (id, name, email, username)

---

### Posts

**Thông tin được tạo:**
- Titles: Topic-based với random variations
- Content: Template-based với 15 variations
- Topics: 20 different topics (Technology, Science, Travel, etc.)
- Likes: Random 0-100
- LikedBy: Empty array (có thể populate sau)
- Tags: Based on topic
- Dates: Distributed trong 1 năm qua
- Author: Random user reference

**Lưu trữ:**
- MongoDB: `posts` collection với `authorId` reference

---

### Relationships

**Thông tin được tạo:**
- Each user follows 10-50 random users
- No self-follows
- No duplicate follows
- No admin relationships (admin không participate trong social network)
- Timestamp: `since` property với created date

**Lưu trữ:**
- Neo4j: `FOLLOWS` relationships giữa User nodes

---

## Verification

### Kiểm Tra MongoDB

```bash
# Mở mongosh
mongosh

# Switch to database
use socialnetwork

# Count users
db.users.countDocuments()

# Count posts
db.posts.countDocuments()

# Sample user
db.users.findOne()

# Sample post with author
db.posts.findOne()
```

**Expected results (Demo):**
- users: 10
- posts: 100

**Expected results (Quick):**
- users: 100
- posts: 5,000

**Expected results (Large):**
- users: 5,000
- posts: 10,000,000

---

### Kiểm Tra Neo4j

**Mở Neo4j Browser:** http://localhost:7474

```cypher
// Count users
MATCH (u:User) RETURN count(u)

// Count relationships
MATCH ()-[r:FOLLOWS]->() RETURN count(r)

// Sample user với followers/following count
MATCH (u:User {id: "USER_ID_FROM_MONGODB"})
OPTIONAL MATCH (u)<-[:FOLLOWS]-(follower)
OPTIONAL MATCH (u)-[:FOLLOWS]->(following)
RETURN u.name, count(DISTINCT follower) as followers, count(DISTINCT following) as following

// Visualize sample network
MATCH (u:User)-[r:FOLLOWS]->(u2:User)
RETURN u, r, u2 LIMIT 50
```

**Expected results:**
- Demo: 10 users, ~25 relationships
- Quick: 100 users, ~500-1K relationships
- Large: 5,000 users, ~150K relationships

---

## Performance Tips

### Cho Large Seeder

**1. Tăng Node.js Memory:**
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run seed:large
```

**2. MongoDB Optimization:**
- Sử dụng SSD storage
- Tăng cache size trong config
- Tắt journaling (dev only)
- Close MongoDB Compass khi seed

**3. Neo4j Optimization:**
- Tăng heap size trong neo4j.conf
- Tắt transaction logs (dev only)
- Close Neo4j Browser khi seed

**4. System Optimization:**
- Close các ứng dụng khác
- Disable antivirus scanning tạm thời
- Sử dụng SSD thay vì HDD
- Đảm bảo đủ RAM available

---

## Troubleshooting

### Error: "Out of memory"

**Nguyên nhân:** Không đủ RAM

**Giải pháp:**
1. Sử dụng `seed:quick` thay vì `seed:large`
2. Tăng Node.js memory limit:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run seed:large
   ```
3. Close các ứng dụng khác
4. Restart máy và chạy lại

---

### Error: "Duplicate key error"

**Nguyên nhân:** Data đã tồn tại trong database

**Giải pháp:**
```bash
# Clean database trước
npm run seed:clean

# Sau đó chạy lại seeder
npm run seed:demo  # hoặc seed khác
```

---

## Expected Performance

### Demo Seeder
- **Time:** 1-2 seconds
- **Memory:** <100MB
- **CPU:** Low
- **Disk I/O:** Minimal

### Quick Seeder
- **Time:** 15-30 seconds
- **Memory:** ~200MB
- **CPU:** Medium
- **Throughput:** ~250-333 posts/sec
- **Disk I/O:** Medium

### Large Seeder
- **Time:** 30-60 minutes
- **Memory:** 2-3GB peak
- **CPU:** High (multi-core utilized)
- **Throughput:** ~3,000-4,000 posts/sec
- **Disk I/O:** Heavy
- **Network:** Moderate (local)

**Breakdown (Large):**
1. Users generation: ~5s
2. Users to MongoDB: ~10s
3. Users to Neo4j: ~15s
4. Posts insertion: ~40m (main bottleneck)
5. Relationships creation: ~30s
6. Final statistics: ~5s

---

## Advanced Usage

### Customize Data

Edit các arrays trong scripts để customize data:

```javascript
// backend/scripts/seed-large-dataset.js

// Thay đổi names
const firstNames = ['Your', 'Custom', 'Names', ...];
const lastNames = ['More', 'Custom', 'Names', ...];

// Thay đổi topics
const topics = ['Your Topic', 'Another Topic', ...];

// Thay đổi post templates
const postTemplates = [
  'Your custom template with {topic}',
  // ...
];

// Điều chỉnh CONFIG
const CONFIG = {
  TOTAL_USERS: 1000,      // Your choice
  POSTS_PER_USER: 500,    // Your choice
  USER_BATCH_SIZE: 50,
  POST_BATCH_SIZE: 500,
};
```

### Partial Seeding

Nếu chỉ muốn seed một phần:

```javascript
// Comment out các phần không cần
// await createUsers();
await createPosts();  // Chỉ tạo posts
// await createRelationships();
```

---

## Security Notes

⚠️ **QUAN TRỌNG:**

- Default password: `password123`

---

**Happy Seeding! 🌱✨**

*Cập nhật: Tháng 11/2025*
