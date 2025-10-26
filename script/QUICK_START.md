# Quick Start - DEV Environment

## 🚀 Development: 1 máy local + Docker

**Mô hình**: Neo4j native + MongoDB Sharded Cluster (Docker) + Web App local  
**Sử dụng khi**: Không có sẵn 4 máy nhóm cho demo production

### 1. Clone và cài đặt
```bash
git clone <repository-url>
cd CT574T_Nhom3
npm install
```

### 2. Khởi động Docker containers (chỉ Shards + Config)
```bash
cd script/mongodb-cluster/docker
docker-compose up mongo-config mongo-shard1 mongo-shard2 mongo-shard3 -d
```

### 3. Cấu hình replica sets (Docker containers)
```bash
# Chờ containers khởi động 2-3 phút, sau đó:

# Config Server replica set
docker exec mongo-config mongosh --port 27019 --eval "rs.initiate({_id: 'configrs', configsvr: true, members: [{_id: 0, host: 'mongo-config:27019'}]})"

# Shard replica sets
docker exec mongo-shard1 mongosh --port 27018 --eval "rs.initiate({_id: 'shard1rs', members: [{_id: 0, host: 'mongo-shard1:27018'}]})"
docker exec mongo-shard2 mongosh --port 27020 --eval "rs.initiate({_id: 'shard2rs', members: [{_id: 0, host: 'mongo-shard2:27020'}]})"
docker exec mongo-shard3 mongosh --port 27021 --eval "rs.initiate({_id: 'shard3rs', members: [{_id: 0, host: 'mongo-shard3:27021'}]})"
```

### 4. Khởi động MongoDB Router (mongos) native
```powershell
# Tạo config file
mkdir C:\mongodb
notepad C:\mongodb\mongos.conf

# Nội dung file:
# net:
#   port: 27017
#   bindIp: 127.0.0.1
# sharding:
#   configDB: configrs/localhost:27019

# Chạy mongos (terminal riêng)
mongos --config C:\mongodb\mongos.conf
```

### 5. Cấu hình sharded cluster (terminal mới)
```bash
# Kết nối mongos và add shards
mongosh --port 27017 --eval "sh.addShard('shard1rs/localhost:27018'); sh.addShard('shard2rs/localhost:27020'); sh.addShard('shard3rs/localhost:27021'); use socialnetwork; sh.enableSharding('socialnetwork'); db.createCollection('users'); sh.shardCollection('socialnetwork.users', {'user_id': 1}); db.createCollection('posts'); sh.shardCollection('socialnetwork.posts', {'user_id': 1}); db.createCollection('comments'); sh.shardCollection('socialnetwork.comments', {'post_id': 1});"
```

### 6. Cài đặt Neo4j native trên Windows
```powershell
# Tải và cài đặt Neo4j Community từ https://neo4j.com/download/
# Hoặc xem hướng dẫn trong script/neo4j/sample-queries.cypher
```

### 7. Tạo .env file
```bash
# Tạo file .env trong root directory
MONGODB_URI=mongodb://localhost:27017/socialnetwork
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password123
NODE_ENV=development
PORT=3000
```

### 8. Khởi động web app
```bash
cd ../../.. # về root directory
npm start
```

## 🧪 Kiểm tra hệ thống

### MongoDB
```bash
# Kết nối mongos native và kiểm tra
mongosh --port 27017

use socialnetwork
sh.status()
db.users.insertOne({user_id: 1, username: "test", email: "test@example.com"})
db.users.find()
```

### Neo4j
- Cài đặt native trên Windows: https://neo4j.com/download/
- Truy cập: http://localhost:7474 
- Username: `neo4j`, Password: `password123`
- Xem sample queries trong `script/neo4j/sample-queries.cypher`

### Web Services
- **Web App**: http://localhost:3000
- **Docker containers**: Chỉ Shards + Config Servers  
- **Health Check**: http://localhost:3000/health

---
**💡 Để demo production với 4 máy thực, xem**: `script/mongodb-cluster/production/windows-production-guide.md`

## 🛑 Tắt hệ thống
```bash
cd script/mongodb-cluster/docker
docker-compose down
```

## 🗑️ Reset hoàn toàn (xóa data)
```bash
docker-compose down -v
```