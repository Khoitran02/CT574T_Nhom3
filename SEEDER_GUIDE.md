# 🌱 Quick Start Guide - Database Seeder

## 📝 Tóm tắt

Hệ thống có **4 seeders** với quy mô khác nhau:

| Seeder | Users | Posts/User | Total Posts | Time | Use Case |
|--------|-------|------------|-------------|------|----------|
| **Demo** | 10 | 10 | 100 | 1-2s | Quick verification |
| **Quick** | 100 | 50 | 5,000 | 15-30s | Development |
| **Large** | 5,000 | 2,000 | 10,000,000 | 30-60m | Production test |
| **Clean** | - | - | - | 5-10s | Database cleanup |

---

## 🚀 Quick Commands

```bash
# 1. Test setup (khuyến nghị chạy đầu tiên)
npm run seed:demo

# 2. Development data
npm run seed:quick

# 3. Production-scale data
npm run seed:large

# 4. Clean everything
npm run seed:clean
```

---

## 📋 Chi tiết từng seeder

### 1️⃣ Demo Seeder (Recommended First Step)
```bash
npm run seed:demo
```
- ✅ 10 users, 100 posts
- ✅ Chạy trong 1-2 giây
- ✅ Verify rằng databases hoạt động
- ✅ Test connections

**Khi nào dùng:**
- Lần đầu setup
- Verify sau khi config databases
- Quick sanity check

---

### 2️⃣ Quick Seeder (Development)
```bash
npm run seed:quick
```
- 👥 100 users
- 📝 5,000 posts (50 posts/user)
- 🔗 500-1000 follow relationships
- ⏱️ 15-30 giây

**Khi nào dùng:**
- Daily development
- Feature testing
- UI/UX testing với real data
- CI/CD pipelines

---

### 3️⃣ Large Seeder (Production Test)
```bash
npm run seed:large
```
- 👥 5,000 users
- 📝 10,000,000 posts (2,000 posts/user)
- 🔗 ~150,000 follow relationships
- ⏱️ 30-60 phút

**Features:**
- ✅ Real-time progress tracking
- ✅ Batch processing for performance
- ✅ Memory-optimized
- ✅ Error recovery

**Yêu cầu hệ thống:**
- RAM: ≥4GB free
- Disk: ≥5GB free
- CPU: Recommend multi-core

**Khi nào dùng:**
- Load testing
- Performance testing
- Production simulation
- Scalability testing

---

### 4️⃣ Clean Database
```bash
npm run seed:clean
```

**⚠️ WARNING:** Xóa **TẤT CẢ** dữ liệu!

**Confirm steps:**
1. Type "yes" để confirm
2. Type "DELETE ALL DATA" để double-confirm

**Xóa:**
- ✅ All MongoDB collections (users, posts, comments)
- ✅ All Neo4j nodes và relationships
- ✅ Cannot be undone!

---

## 🎯 Recommended Workflows

### Workflow 1: First Time Setup
```bash
# Step 1: Verify databases running
npm run test-mongodb
npm run test-neo4j

# Step 2: Run demo seeder
npm run seed:demo

# Step 3: Check data trong Neo4j Browser
# Open: http://localhost:7474

# Step 4: Start development
npm run dev
```

---

### Workflow 2: Daily Development
```bash
# Clean old data
npm run seed:clean

# Load fresh data
npm run seed:quick

# Start server
npm run dev
```

---

### Workflow 3: Load Testing
```bash
# Clean database
npm run seed:clean

# Load large dataset (grab coffee ☕)
npm run seed:large

# Run performance tests
# Monitor MongoDB & Neo4j metrics
```

---

## 📊 Data Overview

### Users
- Usernames: `firstname_lastname###`
- Emails: `firstname_lastname###@example.com`
- Password: **`password123`** (tất cả users)
- Names: Random từ 30 first names × 30 last names
- Bios: Varied topics (Tech, Science, Travel, etc.)
- Avatars: Generated from pravatar.cc

### Posts
- Titles: Topic-based
- Content: Template-based với 15 variations
- Topics: 20 different topics
- Likes: Random 0-100
- Dates: Distributed trong 1 năm qua

### Relationships
- Each user follows 10-50 random users
- No self-follows
- No admin follows
- Stored in Neo4j as `FOLLOWS` relationships

---

## 🔍 Verification

### Check MongoDB
```bash
mongosh

use socialnetwork
db.users.countDocuments()
db.posts.countDocuments()
```

### Check Neo4j
Open Neo4j Browser: http://localhost:7474

```cypher
// Count users
MATCH (u:User) RETURN count(u)

// Count relationships
MATCH ()-[r:FOLLOWS]->() RETURN count(r)

// Visualize sample network
MATCH (u:User)-[r:FOLLOWS]->(u2:User)
RETURN u, r, u2 LIMIT 50
```

---

## ⚡ Performance Tips

### For Large Seeder

1. **Increase Node.js Memory**
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run seed:large
```

2. **MongoDB Optimization**
- Tắt journaling (dev only)
- Increase cache size
- Use SSD

3. **Neo4j Optimization**
- Increase heap size
- Tắt transaction logs (dev only)

4. **System Optimization**
- Close other applications
- Use SSD storage
- Disable antivirus scanning

---

## 🐛 Troubleshooting

### Error: "Connection refused"
```bash
# Check MongoDB
mongosh

# Check Neo4j
# Visit http://localhost:7474
```

**Solution:** Start databases trước khi chạy seeder

---

### Error: "Out of memory"
**Solutions:**
1. Giảm batch sizes trong config
2. Tăng Node.js memory limit
3. Close other apps
4. Restart và chạy lại

---

### Error: "Duplicate key error"
**Solution:** Clean database trước:
```bash
npm run seed:clean
```

---

### Posts inserting slow
**Solutions:**
1. Check MongoDB indexes
2. Use SSD storage
3. Tăng POST_BATCH_SIZE
4. Close monitoring tools

---

## 📈 Expected Performance

### Demo Seeder
- Time: 1-2 seconds
- Memory: <100MB
- CPU: Low

### Quick Seeder
- Time: 15-30 seconds
- Memory: ~200MB
- CPU: Medium
- Rate: ~250-333 posts/sec

### Large Seeder
- Time: 30-60 minutes
- Memory: 2-3GB peak
- CPU: High
- Rate: ~3,000-4,000 posts/sec
- Disk I/O: Heavy

---

## 🔐 Security Notes

**⚠️ IMPORTANT:**
- Default password: `password123`
- **ONLY for development/testing**
- **DO NOT use in production**
- Change passwords sau khi seed
- Không commit .env file

---

## 📚 Additional Resources

- **Full Documentation:** `./scripts/README.md`
- **Neo4j Queries:** `../docs/neo4j/sample-queries.cypher`
- **API Guide:** `../docs/neo4j/NEO4J_API_GUIDE.md`

---

## 🎓 What's Next?

Sau khi seed data:

1. ✅ Test APIs với Postman/Thunder Client
2. ✅ Start frontend và test UI
3. ✅ Run Neo4j analytics queries
4. ✅ Performance testing
5. ✅ Monitor system metrics

---

## 💡 Tips & Tricks

### View Progress in Detail
Scripts có real-time progress với:
- Current/Total items
- Percentage complete
- Elapsed time
- Estimated time remaining

### Customize Data
Edit các arrays trong scripts:
- `firstNames`, `lastNames` - Thay đổi tên
- `topics` - Thêm/bớt topics
- `postTemplates` - Custom post content
- `CONFIG` object - Điều chỉnh số lượng

### Partial Seeding
Chỉnh CONFIG để tạo custom dataset:
```javascript
const CONFIG = {
  TOTAL_USERS: 1000,      // Your choice
  POSTS_PER_USER: 500,    // Your choice
  // ...
};
```

---

## 📞 Need Help?

1. Check console logs
2. Verify database connections
3. Review this guide
4. Check `scripts/README.md`
5. Contact team

---

**Happy Seeding! 🌱🚀**

*Last Updated: November 2025*
