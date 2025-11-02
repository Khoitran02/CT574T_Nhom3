# Quick Start Guide

## ✅ Kiểm tra MongoDB Sharding hoạt động

### Sau khi setup xong, kiểm tra sharding:

```cmd
# 1. Verify containers are running
docker ps

# 2. Check cluster status
mongosh --port 27017 --eval "sh.status()"

# 3. Test data distribution
mongosh --port 27017 --eval "
use socialnetwork;
for(let i=1; i<=30; i++) { 
  db.testUsers.insertOne({user_id: i, name: 'User'+i}) 
}
db.testUsers.getShardDistribution()
"

# 4. Test web app
curl http://localhost:3000
```

### Dấu hiệu sharding hoạt động:
- ✅ 6 MongoDB containers running
- ✅ 1 native mongos process running on host
- ✅ `sh.status()` shows 3 shards active
- ✅ `getShardDistribution()` shows data across multiple shards
- ✅ Web app accessible at localhost:3000

---

## 🚀 Chọn mô hình triển khai

### 1. Development (1 máy - Docker + Native)
**Dành cho**: Learning, Development, Testing

```cmd
# Clone project
git clone [repo-url]
cd CT574T_Nhom3

# Step-by-step setup (10 phút)
docker-compose up -d
# Follow detailed guide in docs/DEVELOPMENT_SETUP.md

# Setup Neo4j và start app
npm install  
npm start
```

**Hướng dẫn chi tiết**: [docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md)

### 2. Production (4 máy Windows LAN)
**Dành cho**: Production, High Availability Demo

```cmd
# Chuẩn bị 4 máy: cài MongoDB, mở firewall
# Setup từng bước thủ công (30 phút)
# Follow detailed guide in docs/PRODUCTION_SETUP.md

# Kết quả: Production cluster với high availability
```

**Hướng dẫn chi tiết**: [docs/PRODUCTION_SETUP.md](docs/PRODUCTION_SETUP.md)

---

## 📋 Yêu cầu hệ thống

### Development
- Docker Desktop
- Neo4j Desktop  
- Node.js 18+
- Windows 10/11, RAM 8GB+

### Production  
- 4 máy Windows trong LAN
- MongoDB Community Server trên mỗi máy
- Neo4j Desktop (máy chính)
- Node.js 18+ (máy chính)

---

## 🎯 Kết quả sau setup

### Services có thể truy cập:
- **Web App**: http://localhost:3000 (hoặc IP máy chính)
- **MongoDB**: mongodb://localhost:27017/socialnetwork
- **Neo4j Browser**: http://localhost:7474

### Test commands:
```cmd
# Test MongoDB cluster (development)
mongosh --port 27017 --eval "sh.status()"

# Test MongoDB cluster (production)  
mongosh --host 192.168.1.100 --port 27017 --eval "sh.status()"

# Check web app
curl http://localhost:3000

# Check containers (development only)
docker ps
```