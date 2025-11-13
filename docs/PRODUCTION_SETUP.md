# Production Setup

## 🎯 Mô hình Production: 3-4 máy Windows thực tế

Dành cho: **Production deployment, High availability, Demo thực tế**

### Kiến trúc (Tương thích với Development Setup)

- **Máy 1**: Web App + MongoDB Router (mongos) + Neo4j
- **Máy 2-4**: MongoDB Sharded Cluster (3 shards + 3 config servers)

> **100% tương thích** với Development setup - chỉ khác về IP addresses và số lượng máy

### Yêu cầu

- 3-4 máy Windows 10/11 trong cùng LAN (hoặc VPN)
- MongoDB Community Server 8.2+ trên mỗi máy (cùng version với Development)
- Node.js 18+ (chỉ máy 1)
- Neo4j Desktop (chỉ máy 1)
- PowerShell 5.1+ trên tất cả máy

---

## 🏗️ IP Planning (thay đổi theo mạng của bạn)

| Máy       | IP            | Role                     | Ports                   |
| --------- | ------------- | ------------------------ | ----------------------- |
| **Máy 1** | 192.168.1.100 | Web App + mongos + Neo4j | 3000, 27016, 7474, 7687 |
| **Máy 2** | 192.168.1.101 | Shard1 + Config1         | 27018, 27019            |
| **Máy 3** | 192.168.1.102 | Shard2 + Config2         | 27018, 27019            |
| **Máy 4** | 192.168.1.103 | Shard3 + Config3         | 27018, 27019            |

---

## 🚀 Cài đặt từng bước (30 phút)

### Bước 1: Chuẩn bị môi trường (10 phút)

**Trên tất cả 4 máy:**

1. **Cài đặt MongoDB**: Download MongoDB Community Server 8.0+ từ mongodb.com
2. **Tạo thư mục dữ liệu**:
   ```cmd
   mkdir C:\data\config1
   mkdir C:\data\config2
   mkdir C:\data\config3
   mkdir C:\data\shard1
   mkdir C:\data\shard2
   mkdir C:\data\shard3
   ```
3. **Mở Windows Firewall** cho các ports: 27016, 27018, 27019
4. **Test kết nối**: Ping giữa các máy để đảm bảo connectivity

### Bước 2: Khởi động MongoDB Services (5 phút với automation)

**📋Manual Setup (Educational)**

**Khởi động từng service trên từng máy:**

**Máy 2 (192.168.1.101):**

```cmd
# Terminal 1: Config Server 1
mongod --configsvr --replSet configrs --port 27019 --dbpath C:\data\config1 --bind_ip 0.0.0.0

# Terminal 2: Shard 1
mongod --shardsvr --replSet shard1rs --port 27018 --dbpath C:\data\shard1 --bind_ip 0.0.0.0
```

**Máy 3 (192.168.1.102):**

```cmd
# Terminal 1: Config Server 2
mongod --configsvr --replSet configrs --port 27019 --dbpath C:\data\config2 --bind_ip 0.0.0.0

# Terminal 2: Shard 2
mongod --shardsvr --replSet shard2rs --port 27018 --dbpath C:\data\shard2 --bind_ip 0.0.0.0
```

**Máy 4 (192.168.1.103):**

```cmd
# Terminal 1: Config Server 3
mongod --configsvr --replSet configrs --port 27019 --dbpath C:\data\config3 --bind_ip 0.0.0.0

# Terminal 2: Shard 3
mongod --shardsvr --replSet shard3rs --port 27018 --dbpath C:\data\shard3 --bind_ip 0.0.0.0
```

> **Lưu ý**: Mỗi lệnh mongod cần chạy trong terminal riêng biệt. Để chạy background, có thể thêm `--logpath` và install MongoDB service.

### Bước 3: Khởi tạo Replica Sets (5 phút) - Chạy trên Máy 1

**Từ máy bất kỳ có mongosh:**

```cmd
# 1. Khởi tạo Config Server Replica Set
mongosh --host 192.168.1.101 --port 27019 --eval "rs.initiate({_id: 'configrs', configsvr: true, members: [{_id: 0, host: '192.168.1.101:27019'}, {_id: 1, host: '192.168.1.102:27019'}, {_id: 2, host: '192.168.1.103:27019'}]})"

# 2. Khởi tạo Shard Replica Sets
mongosh --host 192.168.1.101 --port 27018 --eval "rs.initiate({_id: 'shard1rs', members: [{_id: 0, host: '192.168.1.101:27018'}]})"
mongosh --host 192.168.1.102 --port 27018 --eval "rs.initiate({_id: 'shard2rs', members: [{_id: 0, host: '192.168.1.102:27018'}]})"
mongosh --host 192.168.1.103 --port 27018 --eval "rs.initiate({_id: 'shard3rs', members: [{_id: 0, host: '192.168.1.103:27018'}]})"
```

**Đợi 30 giây** để các replica sets ổn định.

### Bước 4: Setup Sharding trên Máy 1 (5 phút)

**Trên Máy 1 (192.168.1.100):**

```cmd
# 1. Khởi động mongos router
mongos --configdb "configrs/192.168.1.101:27019,192.168.1.102:27019,192.168.1.103:27019" --port 27016 --bind_ip 0.0.0.0

# 2. Trong terminal mới, cấu hình sharding:
mongosh --port 27016 --eval "sh.addShard('shard1rs/192.168.1.101:27018')"
mongosh --port 27016 --eval "sh.addShard('shard2rs/192.168.1.102:27018')"
mongosh --port 27016 --eval "sh.addShard('shard3rs/192.168.1.103:27018')"

# 3. Enable sharding cho database
mongosh --port 27016 --eval "sh.enableSharding('socialnetwork')"

# 4. Shard các collections
mongosh --port 27016 --eval "sh.shardCollection('socialnetwork.users', {'user_id': 1})"
mongosh --port 27016 --eval "sh.shardCollection('socialnetwork.posts', {'user_id': 1})"
mongosh --port 27016 --eval "sh.shardCollection('socialnetwork.comments', {'post_id': 1})"

# 5. Kiểm tra cluster status
mongosh --port 27016 --eval "sh.status()"
```

### Bước 5: Setup Neo4j và Web App (5 phút)

**Trên Máy 1:**

1. **Neo4j Desktop**:
   - Tạo database mới: `socialnetwork`
   - Set password: `password123`
   - Start database

---

## ✅ Kiểm tra hoạt động

```cmd
# 0. Đứng tại thư mục backend
cd <đường dẫn tới backend>

# 1. Test MongoDB cluster
npm run test-mongodb.js

# 2. Test Neo4j connection
npm run test-neo4j.js
```

### Truy cập services (Sửa thành IP Máy 1):

- **Web App**: http://192.168.1.100:3000
- **MongoDB Cluster**: mongodb://192.168.1.100:27016/socialnetwork
- **Neo4j Browser**: http://192.168.1.100:7474 (neo4j/password123)

---

## 💡 Lưu ý quan trọng

- **Không cần PowerShell scripts**: Tất cả commands đều chạy trực tiếp
- **Manual setup**: Linh hoạt hơn, dễ troubleshoot
- **Step-by-step**: Từng bước có thể kiểm tra và debug
- **Production ready**: Tuân thủ MongoDB best practices

**Setup Time**: ~30 phút (manual)
**Tài nguyên**: Phân tán trên 4 máy
**High Availability**: ✅ Chịu được 1 máy down
**Maintenance**: Dễ dàng restart từng component
