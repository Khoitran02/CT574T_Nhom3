# MongoDB Sharded Cluster với 3 Config Servers - Windows Production

## Tổng quan
Hướng dẫn cài đặt MongoDB Sharded Cluster với 3 Config Servers + Neo4j trên 4 máy Windows.

## Kiến trúc hệ thống
```
┌─────────────────────────────┐  ┌─────────────────────────────┐
│         PC-1                │  │         PC-2                │
│  ┌─────────────────────┐    │  │  ┌─────────────────────┐    │
│  │ Web App (Node.js)   │    │  │  │   MongoDB Shard 1   │    │
│  │ Port: 3000          │    │  │  │   Port: 27018       │    │
│  ├─────────────────────┤    │  │  ├─────────────────────┤    │
│  │ MongoDB Router      │    │  │  │  Config Server 1    │    │
│  │ (mongos)            │    │  │  │  Port: 27019        │    │
│  │ Port: 27017         │    │  │  │  (configrs primary) │    │
│  ├─────────────────────┤    │  │  └─────────────────────┘    │
│  │      Neo4j          │    │  └─────────────────────────────┘
│  │ Port: 7474, 7687    │    │
│  └─────────────────────┘    │  ┌─────────────────────────────┐
└─────────────────────────────┘  │         PC-3                │
                                 │  ┌─────────────────────┐    │
┌─────────────────────────────┐  │  │   MongoDB Shard 2   │    │
│         PC-4                │  │  │   Port: 27020       │    │
│  ┌─────────────────────┐    │  │  ├─────────────────────┤    │
│  │   MongoDB Shard 3   │    │  │  │  Config Server 2    │    │
│  │   Port: 27021       │    │  │  │  Port: 27019        │    │
│  ├─────────────────────┤    │  │  │  (configrs member)  │    │
│  │  Config Server 3    │    │  │  └─────────────────────┘    │
│  │  Port: 27019        │    │  └─────────────────────────────┘
│  │  (configrs member)  │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

## Thông tin máy
| Máy | Vai trò | IP Address | Components | Ports |
|-----|---------|------------|------------|-------|
| PC-1 | Web Server | 192.168.1.10 | Node.js + mongos + Neo4j | 3000, 27017, 7474, 7687 |
| PC-2 | Shard 1 + Config 1 | 192.168.1.11 | Shard 1 + Config Server 1 | 27018, 27019 |
| PC-3 | Shard 2 + Config 2 | 192.168.1.12 | Shard 2 + Config Server 2 | 27020, 27019 |
| PC-4 | Shard 3 + Config 3 | 192.168.1.13 | Shard 3 + Config Server 3 | 27021, 27019 |

## BƯỚC 1: Chuẩn bị môi trường (tất cả máy)

### 1.1 Cấu hình firewall
```powershell
# Chạy PowerShell as Administrator
New-NetFirewallRule -DisplayName "MongoDB Ports" -Direction Inbound -Protocol TCP -LocalPort 27017-27021 -Action Allow
New-NetFirewallRule -DisplayName "Neo4j Ports" -Direction Inbound -Protocol TCP -LocalPort 7474,7687 -Action Allow
New-NetFirewallRule -DisplayName "Web App" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### 1.2 Cấu hình hosts file (tất cả máy)
```powershell
notepad C:\Windows\System32\drivers\etc\hosts
```
Thêm:
```
192.168.1.10    pc-web
192.168.1.11    pc-shard1
192.168.1.12    pc-shard2
192.168.1.13    pc-shard3
```

### 1.3 Cài đặt MongoDB (PC-1, PC-2, PC-3, PC-4)
1. Download: https://www.mongodb.com/try/download/community
2. Cài MongoDB Community Server với default settings
3. Tạo directories:
```powershell
mkdir C:\data\db, C:\data\configdb, C:\logs\mongodb, C:\mongodb
```

## BƯỚC 2: Cấu hình PC-1 (Web Server + MongoDB Router + Neo4j)

### 2.1 MongoDB Router (mongos)
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
  bindIp: 0.0.0.0
processManagement:
  windowsService:
    serviceName: MongoDBRouter
    displayName: MongoDB Router
sharding:
  configDB: configrs/192.168.1.11:27019,192.168.1.12:27019,192.168.1.13:27019
```

### 2.2 Cài đặt Node.js
1. Download từ: https://nodejs.org/ (LTS version)
2. Verify: `node --version`

### 2.3 Cài đặt Neo4j
```powershell
# 1. Install Java 11+
# 2. Download Neo4j Community, extract vào C:\neo4j
C:\neo4j\bin\neo4j-admin.bat set-initial-password password123
C:\neo4j\bin\neo4j.bat install-service
C:\neo4j\bin\neo4j.bat start
```

*Lưu ý: MongoDB Router sẽ được khởi động sau khi Config Servers sẵn sàng*

## BƯỚC 3: Cấu hình PC-2 (Shard 1 + Config Server 1)

### 3.1 Config Server 1
```powershell
notepad C:\mongodb\config-server.conf
```
```yaml
storage:
  dbPath: C:\data\configdb
  journal:
    enabled: true
systemLog:
  destination: file
  path: C:\logs\mongodb\config-server.log
  logAppend: true
net:
  port: 27019
  bindIp: 0.0.0.0
processManagement:
  windowsService:
    serviceName: MongoDBConfigServer
    displayName: MongoDB Config Server
sharding:
  clusterRole: configsvr
replication:
  replSetName: configrs
```

### 3.2 Shard 1
```powershell
notepad C:\mongodb\shard1.conf
```
```yaml
storage:
  dbPath: C:\data\db
  journal:
    enabled: true
systemLog:
  destination: file
  path: C:\logs\mongodb\shard1.log
  logAppend: true
net:
  port: 27018
  bindIp: 0.0.0.0
processManagement:
  windowsService:
    serviceName: MongoDBShard1
    displayName: MongoDB Shard 1
sharding:
  clusterRole: shardsvr
replication:
  replSetName: shard1rs
```

### 3.3 Khởi động services
```powershell
mongod --config C:\mongodb\config-server.conf --install
mongod --config C:\mongodb\shard1.conf --install
Start-Service MongoDBConfigServer
Start-Service MongoDBShard1
```

## BƯỚC 4: Cấu hình PC-3 (Shard 2 + Config Server 2)

### 4.1 Config Server 2
```powershell
notepad C:\mongodb\config-server.conf
```
```yaml
storage:
  dbPath: C:\data\configdb
  journal:
    enabled: true
systemLog:
  destination: file
  path: C:\logs\mongodb\config-server.log
  logAppend: true
net:
  port: 27019
  bindIp: 0.0.0.0
processManagement:
  windowsService:
    serviceName: MongoDBConfigServer
    displayName: MongoDB Config Server
sharding:
  clusterRole: configsvr
replication:
  replSetName: configrs
```

### 4.2 Shard 2
```powershell
notepad C:\mongodb\shard2.conf
```
```yaml
storage:
  dbPath: C:\data\db
  journal:
    enabled: true
systemLog:
  destination: file
  path: C:\logs\mongodb\shard2.log
  logAppend: true
net:
  port: 27020
  bindIp: 0.0.0.0
processManagement:
  windowsService:
    serviceName: MongoDBShard2
    displayName: MongoDB Shard 2
sharding:
  clusterRole: shardsvr
replication:
  replSetName: shard2rs
```

### 4.3 Khởi động services
```powershell
mongod --config C:\mongodb\config-server.conf --install
mongod --config C:\mongodb\shard2.conf --install
Start-Service MongoDBConfigServer
Start-Service MongoDBShard2
```

## BƯỚC 5: Cấu hình PC-4 (Shard 3 + Config Server 3)

### 5.1 Config Server 3
```powershell
notepad C:\mongodb\config-server.conf
```
```yaml
storage:
  dbPath: C:\data\configdb
  journal:
    enabled: true
systemLog:
  destination: file
  path: C:\logs\mongodb\config-server.log
  logAppend: true
net:
  port: 27019
  bindIp: 0.0.0.0
processManagement:
  windowsService:
    serviceName: MongoDBConfigServer
    displayName: MongoDB Config Server
sharding:
  clusterRole: configsvr
replication:
  replSetName: configrs
```

### 5.2 Shard 3
```powershell
notepad C:\mongodb\shard3.conf
```
```yaml
storage:
  dbPath: C:\data\db
  journal:
    enabled: true
systemLog:
  destination: file
  path: C:\logs\mongodb\shard3.log
  logAppend: true
net:
  port: 27021
  bindIp: 0.0.0.0
processManagement:
  windowsService:
    serviceName: MongoDBShard3
    displayName: MongoDB Shard 3
sharding:
  clusterRole: shardsvr
replication:
  replSetName: shard3rs
```

### 5.3 Khởi động services
```powershell
mongod --config C:\mongodb\config-server.conf --install
mongod --config C:\mongodb\shard3.conf --install
Start-Service MongoDBConfigServer
Start-Service MongoDBShard3
```

## BƯỚC 6: Khởi tạo Config Server Replica Set (từ PC-2)

```powershell
mongosh --host 192.168.1.11:27019
```
```javascript
rs.initiate({
  _id: "configrs",
  configsvr: true,
  members: [
    { _id: 0, host: "192.168.1.11:27019" },
    { _id: 1, host: "192.168.1.12:27019" },
    { _id: 2, host: "192.168.1.13:27019" }
  ]
})

// Chờ election complete
rs.status()
exit
```

## BƯỚC 7: Khởi tạo Shard Replica Sets (từ PC-1)

```powershell
# Shard 1
mongosh --host 192.168.1.11:27018
rs.initiate({
  _id: "shard1rs",
  members: [{ _id: 0, host: "192.168.1.11:27018" }]
})
exit

# Shard 2
mongosh --host 192.168.1.12:27020
rs.initiate({
  _id: "shard2rs",
  members: [{ _id: 0, host: "192.168.1.12:27020" }]
})
exit

# Shard 3
mongosh --host 192.168.1.13:27021
rs.initiate({
  _id: "shard3rs",
  members: [{ _id: 0, host: "192.168.1.13:27021" }]
})
exit
```

## BƯỚC 8: Khởi động MongoDB Router (PC-1)

```powershell
# Chờ Config Server Replica Set ready (bước 6 hoàn thành), sau đó:
mongos --config C:\mongodb\mongos.conf --install
Start-Service MongoDBRouter
```

## BƯỚC 9: Cấu hình Sharded Cluster (từ PC-1)

```powershell
mongosh --host 192.168.1.10:27017
```
```javascript
// Thêm shards
sh.addShard("shard1rs/192.168.1.11:27018")
sh.addShard("shard2rs/192.168.1.12:27020")
sh.addShard("shard3rs/192.168.1.13:27021")

// Kiểm tra cluster
sh.status()

// Enable sharding
use socialnetwork
sh.enableSharding("socialnetwork")

// Shard collections
db.createCollection("users")
sh.shardCollection("socialnetwork.users", {"user_id": 1})

db.createCollection("posts")
sh.shardCollection("socialnetwork.posts", {"user_id": 1})

db.createCollection("comments")
sh.shardCollection("socialnetwork.comments", {"post_id": 1})

sh.status()
exit
```

## BƯỚC 10: Setup Web Application (PC-1)

```powershell
# Clone project
git clone <repository-url>
cd CT574T_Nhom3
npm install

# Tạo .env
notepad .env
```
```env
MONGODB_URI=mongodb://192.168.1.10:27017/socialnetwork
NEO4J_URI=bolt://192.168.1.10:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password123
NODE_ENV=production
PORT=3000
```

```powershell
npm start
```

## BƯỚC 11: Test hệ thống

### Test MongoDB High Availability
```powershell
# Từ PC-1, test failover
mongosh --host 192.168.1.10:27017

use socialnetwork
db.users.insertMany([
  {user_id: 1, username: "john", email: "john@test.com"},
  {user_id: 2, username: "jane", email: "jane@test.com"}
])

# Tắt Config Server trên PC-2
# Cluster vẫn hoạt động với 2/3 Config Servers
db.users.find()
sh.status()
```

### Test Neo4j
- Truy cập: http://192.168.1.10:7474
- Login: neo4j / password123
- Test: `CREATE (u:User {name: 'Test'}) RETURN u`

## Monitoring và Troubleshooting

### Kiểm tra services
```powershell
Get-Service MongoDB*
```

### Kiểm tra Config Server Replica Set
```powershell
mongosh --host 192.168.1.11:27019 --eval "rs.status()"
```

### Xem logs
```powershell
Get-Content C:\logs\mongodb\*.log -Tail 20
```

## Kết nối từ ứng dụng
- **MongoDB**: `mongodb://192.168.1.10:27017/socialnetwork`
- **Neo4j**: `bolt://192.168.1.10:7687`
- **Web App**: `http://192.168.1.10:3000`

## Lợi ích của 3 Config Servers
- ✅ **High Availability**: Chịu được 1 Config Server down
- ✅ **No Single Point of Failure**: Cluster vẫn hoạt động
- ✅ **Production Ready**: Đáp ứng MongoDB best practices
- ✅ **Demo Impressive**: Show được failover capability