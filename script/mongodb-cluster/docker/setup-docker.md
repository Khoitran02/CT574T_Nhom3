# DEV Environment: MongoDB Sharded Cluster với Docker

## Tổng quan
**Môi trường Development Hybrid** - Native Windows components (Neo4j, Web App, mongos) + Docker containers cho Shards và Config Servers. Kiến trúc này gần giống production hơn và dễ debug/monitor.

## Yêu cầu hệ thống
- Docker Desktop (Windows/Mac/Linux)
- RAM: 8GB+ (khuyến nghị 16GB)
- CPU: 4 cores+
- Disk trống: 20GB+

## Kiến trúc DEV Environment (Hybrid Native + Docker)
```
┌─────────────────────────────┐
│       Native Windows        │
│  ┌─────────────────────┐    │
│  │      Neo4j          │    │ ← Native Installation
│  │ Port: 7474, 7687    │    │
│  ├─────────────────────┤    │
│  │   Web App           │    │ ← Native Node.js
│  │   Port: 3000        │    │
│  ├─────────────────────┤    │
│  │ MongoDB Router      │    │ ← Native mongos
│  │ (mongos)            │    │
│  │ Port: 27017         │    │
│  ├─────────────────────┤    │
│  │  Mongo Express      │    │ ← Native (optional)
│  │  Port: 8081         │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
              │
              │ Connects to
              ▼
┌─────────────────────────────┐ ← Docker Containers
│         Docker Host         │
│  ┌─────────────────────┐    │
│  │     Container 1     │    │
│  │  Shard 1 + Config 1│    │
│  │  Port: 27018,27019  │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │     Container 2     │    │
│  │  Shard 2 + Config 2│    │
│  │  Port: 27020,27119  │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │     Container 3     │    │
│  │  Shard 3 + Config 3│    │
│  │  Port: 27021,27219  │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

## Bước 1: Cài đặt MongoDB native (Windows)

### 1.1 Cài đặt MongoDB Community Server
1. Download: https://www.mongodb.com/try/download/community
2. Cài MongoDB Community Server (mặc định)
3. Tạo directories:
```powershell
mkdir C:\data\db, C:\data\configdb, C:\logs\mongodb, C:\mongodb
```

### 1.2 Cài đặt MongoDB Database Tools (cho mongos)
1. Download: https://www.mongodb.com/try/download/database-tools
2. Extract và add vào PATH

### 1.3 Kiểm tra Docker
```bash
docker --version
docker-compose --version
```

## Bước 2: Khởi chạy Docker containers (chỉ Shards + Config Servers)

### 2.1 Khởi động containers
```bash
# Di chuyển đến thư mục chứa docker-compose.yml
cd script/mongodb-cluster/docker

# Khởi động chỉ MongoDB containers (không có mongos và mongo-express)
docker-compose up mongo-config mongo-shard1 mongo-shard2 mongo-shard3 -d

# Kiểm tra trạng thái containers
docker-compose ps
```

### 2.2 Chờ containers khởi động
Chờ khoảng 2-3 phút để tất cả containers khởi động hoàn tất.

## Bước 3: Cấu hình Replica Sets

### 3.1 Cấu hình Config Server Replica Set
```bash
# Kết nối vào config server
docker exec -it mongo-config mongosh --port 27019

# Khởi tạo replica set cho config server
rs.initiate({
  _id: "configrs",
  configsvr: true,
  members: [
    { _id: 0, host: "mongo-config:27019" }
  ]
})

# Kiểm tra trạng thái
rs.status()
exit
```

### 3.2 Cấu hình Shard Replica Sets
```bash
# Shard 1
docker exec -it mongo-shard1 mongosh --port 27018
rs.initiate({
  _id: "shard1rs",
  members: [
    { _id: 0, host: "mongo-shard1:27018" }
  ]
})
rs.status()
exit

# Shard 2  
docker exec -it mongo-shard2 mongosh --port 27020
rs.initiate({
  _id: "shard2rs", 
  members: [
    { _id: 0, host: "mongo-shard2:27020" }
  ]
})
rs.status()
exit

# Shard 3
docker exec -it mongo-shard3 mongosh --port 27021
rs.initiate({
  _id: "shard3rs",
  members: [
    { _id: 0, host: "mongo-shard3:27021" }
  ]
})
rs.status()
exit
```

## Bước 4: Cấu hình MongoDB Router (mongos) native

### 4.1 Tạo file cấu hình mongos
```powershell
notepad C:\mongodb\mongos.conf
```
```yaml
systemLog:
  destination: file
  path: C:\logs\mongodb\mongos.log
  logAppend: true
net:
  port: 27017
  bindIp: 127.0.0.1
sharding:
  configDB: configrs/localhost:27019
```

### 4.2 Khởi động mongos
```powershell
# Chạy mongos (giữ terminal này mở)
mongos --config C:\mongodb\mongos.conf
```

### 4.3 Mở terminal mới và cấu hình cluster
```bash
# Kết nối vào mongos router (terminal mới)
mongosh --port 27017

# Thêm các shards (Docker containers)
sh.addShard("shard1rs/localhost:27018")
sh.addShard("shard2rs/localhost:27020") 
sh.addShard("shard3rs/localhost:27021")

# Kiểm tra trạng thái cluster
sh.status()
```

### 4.2 Enable sharding cho database
```bash
# Tạo database và enable sharding
use socialnetwork
sh.enableSharding("socialnetwork")

# Shard collection users theo user_id
db.createCollection("users")
sh.shardCollection("socialnetwork.users", {"user_id": 1})

# Shard collection posts theo user_id  
db.createCollection("posts")
sh.shardCollection("socialnetwork.posts", {"user_id": 1})

# Shard collection comments theo post_id
db.createCollection("comments") 
sh.shardCollection("socialnetwork.comments", {"post_id": 1})

# Kiểm tra sharding status
sh.status()
exit
```

## Bước 5: Cài đặt Neo4j và Web App native

### 5.1 Cài đặt Neo4j
Xem hướng dẫn: `script/neo4j/windows-setup.md`

### 5.2 Cài đặt Node.js dependencies
```powershell
cd ..\..\..  # Về root project
npm install
```

### 5.3 Tạo file .env
```env
MONGODB_URI=mongodb://localhost:27017/socialnetwork
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password123
NODE_ENV=development
PORT=3000
```

## Bước 6: Test dữ liệu mẫu

### 6.1 Thêm dữ liệu vào MongoDB
```bash
# Kết nối vào mongos native
mongosh --port 27017

use socialnetwork

# Thêm users
db.users.insertMany([
  {user_id: 1, username: "john_doe", email: "john@example.com", created_at: new Date()},
  {user_id: 2, username: "jane_smith", email: "jane@example.com", created_at: new Date()},
  {user_id: 3, username: "bob_wilson", email: "bob@example.com", created_at: new Date()}
])

# Thêm posts
db.posts.insertMany([
  {post_id: 1, user_id: 1, content: "My first post!", created_at: new Date()},
  {post_id: 2, user_id: 2, content: "Hello world!", created_at: new Date()}
])

# Thêm comments
db.comments.insertMany([
  {comment_id: 1, post_id: 1, user_id: 2, content: "Nice post!", created_at: new Date()},
  {comment_id: 2, post_id: 1, user_id: 3, content: "Great!", created_at: new Date()}
])

# Kiểm tra dữ liệu đã được shard
db.users.getShardDistribution()
db.posts.getShardDistribution() 
db.comments.getShardDistribution()

exit
```

## Bước 7: Khởi động Web Application

```powershell
# Khởi động web app
npm start
```

## Bước 8: Quản lý hệ thống

### 8.1 Tắt cluster
```bash
# Tắt Docker containers
docker-compose down

# Tắt mongos (Ctrl+C trong terminal mongos)
# Tắt Neo4j (Neo4j Desktop hoặc service)
```

### 8.2 Khởi động lại
```bash
# 1. Khởi động Docker containers
docker-compose up mongo-config mongo-shard1 mongo-shard2 mongo-shard3 -d

# 2. Khởi động Neo4j

# 3. Khởi động mongos
mongos --config C:\mongodb\mongos.conf

# 4. Khởi động web app (terminal mới)
npm start
```

### 8.3 Xóa hoàn toàn dữ liệu Docker
```bash
docker-compose down -v
```

## Kết nối từ ứng dụng Node.js

### MongoDB Connection String
```javascript
const mongoUri = "mongodb://localhost:27017/socialnetwork";
```

### Neo4j Connection  
```javascript
// Neo4j sẽ được cài đặt native trên Windows
// Xem hướng dẫn trong script/neo4j/sample-queries.cypher
const neo4j = require('neo4j-driver');
const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'password123')
);
```

## Troubleshooting

### Lỗi thường gặp
1. **Container không khởi động**: Kiểm tra ports không bị conflict
2. **Replica set initialization failed**: Đảm bảo containers đã ready
3. **Không kết nối được**: Kiểm tra network connectivity

### Logs debugging
```bash
# Xem logs của container cụ thể
docker-compose logs mongo-config
docker-compose logs mongo-shard1
# Follow logs real-time
docker-compose logs -f mongo-router
```

### Monitoring
```bash
# Kiểm tra resource usage
docker stats

# Kiểm tra cluster health
docker exec -it mongo-router mongosh --eval "sh.status()"
```

## Thông tin kết nối

### Native Components (Windows)
- **Web App**: http://localhost:3000
- **MongoDB Router (mongos)**: localhost:27017 
- **Neo4j Browser**: http://localhost:7474
- **Neo4j Bolt**: bolt://localhost:7687

### Docker Components
- **Config Server**: localhost:27019
- **Shard 1**: localhost:27018  
- **Shard 2**: localhost:27020
- **Shard 3**: localhost:27021

### Monitoring Commands
```powershell
# Kiểm tra cluster status
mongosh --port 27017 --eval "sh.status()"

# Kiểm tra Docker containers
docker ps

# Xem logs
docker logs mongo-shard1
docker logs mongo-config
```