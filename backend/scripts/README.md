# Database Seeder Scripts

## � Setup & Verification

### Setup Sharding (TRƯỚC KHI SEED)
```bash
node scripts/setup-sharding.js
```
**QUAN TRỌNG:** Phải chạy script này TRƯỚC khi seed data để MongoDB tạo chunks đúng cách.

### Verify Shard Distribution (Node.js)
```bash
npm run verify:shards
```
Kiểm tra xem data đã được phân phối đúng trên các shards chưa:
- ✅ Phân phối cân bằng (~33% mỗi shard)
- ✅ Không có orphaned documents
- ✅ Không có duplicates
- ✅ So sánh actual vs sample distribution

### Verify Single Document (Mongosh)
```bash
mongosh --port 27017
```
```javascript
load('scripts/verify-single-document.js')
verifyUserLocation(ObjectId("..."))
verifyPostLocation(ObjectId("..."))
testRandomDocuments(10)
```
Kiểm tra một document cụ thể:
- ✅ Hash shard key
- ✅ Predict shard từ chunk ranges
- ✅ Verify với explain()
- ✅ So sánh predicted vs actual

📖 **Chi tiết:** Xem [VERIFY_SHARD_GUIDE.md](VERIFY_SHARD_GUIDE.md)

## �📋 Available Commands

### 1. Demo Seeder
```bash
npm run seed:demo
```
- 10 users, 100 posts
- Thời gian: ~5 giây
- Use case: Quick demo, testing UI

### 2. Quick Seeder  
```bash
npm run seed:quick
```
- 100 users, 5,000 posts (50 posts/user)
- 50% posts có 1-2 ảnh random
- Follow relationships: ~500-1000
- Thời gian: ~15-30 giây
- Use case: Development testing

### 3. Large Dataset Seeder
```bash
npm run seed:large
```
- 2,000 users, 2,000,000 posts (1000 posts/user)
- 50% posts có 1-2 ảnh random
- Follow relationships: ~60,000
- Thời gian: ~15-20 phút
- Use case: Performance testing, production simulation

### 4. Clean Database
```bash
npm run seed:clean
```
- Xóa toàn bộ dữ liệu từ MongoDB và Neo4j
- Yêu cầu confirm 2 lần
- ⚠️ Không thể hoàn tác!

### 5. Generate Sample Images (One-time)
```bash
npm run generate:images
```
- Tạo 100 ảnh SVG mẫu (~0.47KB/ảnh)
- Lưu vào: `backend/public/uploads/sample-images/`
- Chỉ cần chạy 1 lần duy nhất

## 📊 Data Generated

**Users**: username, email, password (123456@aB), name, bio, avatar, role:user

**Posts**: content, author, authorId, tags, likes, images (50%), mentions, emojis, createdAt

**Neo4j**: (User)-[:FOLLOWS]->(User), (User)-[:CREATED]->(Post)

## ⚙️ Configuration

Edit batch sizes trong các file seed nếu cần:
- `seed-quick.js`: TOTAL_USERS, POSTS_PER_USER
- `seed-large-dataset.js`: USER_BATCH_SIZE, POST_BATCH_SIZE

## 🔧 Requirements

- MongoDB Cluster đang chạy
- Neo4j đang chạy  
- RAM: ≥4GB free (cho large dataset)
- Disk space: ≥3GB free
