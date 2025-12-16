# Production Setup  
## 🎯 Mô hình Production: 4 Máy

### Kiến trúc Tối Ưu (4 máy)
- **Máy 1**: Web App + MongoDB Router (mongos) + Neo4j
- **Máy 2**: Config1 + Shard1-Node1 + Shard2-Node1 + Shard3-Node1
- **Máy 3**: Config2 + Shard1-Node2 + Shard2-Node2 + Shard3-Node2
- **Máy 4**: Config3 + Shard1-Node3 + Shard2-Node3 + Shard3-Node3

### Yêu cầu
- 4 máy Windows 10/11 trong cùng LAN
- MongoDB Community Server 8.2+ (cùng version trên tất cả máy)
- Node.js 18+ (chỉ máy 1)
- Neo4j Desktop (chỉ máy 1)
- PowerShell 5.1+
- RAM: 4GB+ mỗi máy

---

## 🏗️ IP Planning (4 máy)

| Máy | IP | Services | Ports |
|-----|----|----- |-------|
| **Máy 1** | LAPTOP-8AOJN7HN | Web App + mongos + Neo4j | 3000, 27017, 7474, 7687 |
| **Máy 2** | DESKTOP-0LH5AR4 | Config1 + Shard1-N1 + Shard2-N1 + Shard3-N1 | 27019, 27022, 27025, 27028 |
| **Máy 3** | CTY9-SP-KHOI | Config2 + Shard1-N2 + Shard2-N2 + Shard3-N2 | 27020, 27023, 27026, 27029 |
| **Máy 4** | DESKTOP-O4RE9KS | Config3 + Shard1-N3 + Shard2-N3 + Shard3-N3 | 27021, 27024, 27027, 27030 |

**Chi tiết phân bố:**

**Máy 1 (Application Layer):**
- mongos Router: port 27017
- Web App (Backend + Frontend): port 3000
- Neo4j: ports 7474, 7687

**Máy 2 (Data Layer - Node 1 của mỗi shard):**
- Config Server 1: port 27019
- Shard1-Node1: port 27022 (shard1rs)
- Shard2-Node1: port 27025 (shard2rs)
- Shard3-Node1: port 27028 (shard3rs)

**Máy 3 (Data Layer - Node 2 của mỗi shard):**
- Config Server 2: port 27020
- Shard1-Node2: port 27023 (shard1rs)
- Shard2-Node2: port 27026 (shard2rs)
- Shard3-Node2: port 27029 (shard3rs)

**Máy 4 (Data Layer - Node 3 của mỗi shard):**
- Config Server 3: port 27021
- Shard1-Node3: port 27024 (shard1rs)
- Shard2-Node3: port 27027 (shard2rs)
- Shard3-Node3: port 27030 (shard3rs)
---

## 🚀 Setup từng bước (30 phút)

### Bước 1: Chuẩn bị (5 phút)

**Trên tất cả 4 máy:**

1. **Cài đặt MongoDB Community Server 8.2+**

2. **Tạo thư mục dữ liệu:**
   
   **Máy 1 (Application Layer):**
   ```cmd
   # Không cần data directories (chỉ chạy mongos router)
   ```
   
   **Máy 2 (Node 1 của các shards):**
   ```cmd
   mkdir C:\data\config1
   mkdir C:\data\shard1-node1
   mkdir C:\data\shard2-node1
   mkdir C:\data\shard3-node1
   ```
   
   **Máy 3 (Node 2 của các shards):**
   ```cmd
   mkdir C:\data\config2
   mkdir C:\data\shard1-node2
   mkdir C:\data\shard2-node2
   mkdir C:\data\shard3-node2
   ```
   
   **Máy 4 (Node 3 của các shards):**
   ```cmd
   mkdir C:\data\config3
   mkdir C:\data\shard1-node3
   mkdir C:\data\shard2-node3
   mkdir C:\data\shard3-node3
   ```

3. **Mở Windows Firewall:**
   ```powershell
   # Mở tất cả ports MongoDB (27017-27030)
   New-NetFirewallRule -DisplayName "MongoDB Cluster" -Direction Inbound -LocalPort 27017-27030 -Protocol TCP -Action Allow
   ```

4. **Test connectivity:**
   ```cmd
   # Từ mỗi máy, ping các máy khác
   ping LAPTOP-8AOJN7HN
   ping DESKTOP-0LH5AR4
   ping CTY9-SP-KHOI
   ping DESKTOP-O4RE9KS
   ```

### Bước 2: Start Config Servers (3 phút)

**Máy 2 (DESKTOP-0LH5AR4) - Config1:**
```powershell
mongod --configsvr --replSet configrs --port 27019 --dbpath C:\data\config1 --bind_ip 0.0.0.0
```

**Máy 3 (CTY9-SP-KHOI) - Config2:**
```powershell
mongod --configsvr --replSet configrs --port 27020 --dbpath C:\data\config2 --bind_ip 0.0.0.0
```

**Máy 4 (DESKTOP-O4RE9KS) - Config3:**
```powershell
mongod --configsvr --replSet configrs --port 27021 --dbpath C:\data\config3 --bind_ip 0.0.0.0
```

### Bước 3: Initialize Config Replica Set (1 phút)

**Từ máy bất kỳ (khuyến nghị Máy 1):**
```powershell
mongosh --host DESKTOP-0LH5AR4 --port 27019 --eval "rs.initiate({_id: 'configrs', configsvr: true, members: [{_id: 0, host: 'DESKTOP-0LH5AR4:27019', priority: 2}, {_id: 1, host: 'CTY9-SP-KHOI:27020', priority: 1}, {_id: 2, host: 'DESKTOP-O4RE9KS:27021', priority: 1}]})"
```

Đợi 15 giây cho config servers ổn định.

### Bước 4: Start Shard Servers (5 phút)

**Shard 1 Replica Set (3 nodes phân tán 3 máy):**

Máy 2:
```powershell
mongod --shardsvr --replSet shard1rs --port 27022 --dbpath C:\data\shard1-node1 --bind_ip 0.0.0.0
```

Máy 3:
```powershell
mongod --shardsvr --replSet shard1rs --port 27023 --dbpath C:\data\shard1-node2 --bind_ip 0.0.0.0
```

Máy 4:
```powershell
mongod --shardsvr --replSet shard1rs --port 27024 --dbpath C:\data\shard1-node3 --bind_ip 0.0.0.0
```

**Shard 2 Replica Set (3 nodes phân tán 3 máy):**

Máy 2:
```powershell
mongod --shardsvr --replSet shard2rs --port 27025 --dbpath C:\data\shard2-node1 --bind_ip 0.0.0.0
```

Máy 3:
```powershell
mongod --shardsvr --replSet shard2rs --port 27026 --dbpath C:\data\shard2-node2 --bind_ip 0.0.0.0
```

Máy 4:
```powershell
mongod --shardsvr --replSet shard2rs --port 27027 --dbpath C:\data\shard2-node3 --bind_ip 0.0.0.0
```

**Shard 3 Replica Set (3 nodes phân tán 3 máy):**

Máy 2:
```powershell
mongod --shardsvr --replSet shard3rs --port 27028 --dbpath C:\data\shard3-node1 --bind_ip 0.0.0.0
```

Máy 3:
```powershell
mongod --shardsvr --replSet shard3rs --port 27029 --dbpath C:\data\shard3-node2 --bind_ip 0.0.0.0
```

Máy 4:
```powershell
mongod --shardsvr --replSet shard3rs --port 27030 --dbpath C:\data\shard3-node3 --bind_ip 0.0.0.0
```

### Bước 5: Initialize Shard Replica Sets (2 phút)

**Từ máy bất kỳ (khuyến nghị Máy 1):**

```powershell
# Initialize Shard 1 Replica Set (phân tán trên Máy 2,3,4)
mongosh --host DESKTOP-0LH5AR4 --port 27022 --eval "rs.initiate({_id: 'shard1rs', members: [{_id: 0, host: 'DESKTOP-0LH5AR4:27022', priority: 2}, {_id: 1, host: 'CTY9-SP-KHOI:27023', priority: 1}, {_id: 2, host: 'DESKTOP-O4RE9KS:27024', priority: 1}]})"

# Đợi 15 giây
Start-Sleep 15

# Initialize Shard 2 Replica Set (phân tán trên Máy 2,3,4)
mongosh --host DESKTOP-0LH5AR4 --port 27025 --eval "rs.initiate({_id: 'shard2rs', members: [{_id: 0, host: 'DESKTOP-0LH5AR4:27025', priority: 2}, {_id: 1, host: 'CTY9-SP-KHOI:27026', priority: 1}, {_id: 2, host: 'DESKTOP-O4RE9KS:27027', priority: 1}]})"

# Đợi 15 giây
Start-Sleep 15

# Initialize Shard 3 Replica Set (phân tán trên Máy 2,3,4)
mongosh --host DESKTOP-0LH5AR4 --port 27028 --eval "rs.initiate({_id: 'shard3rs', members: [{_id: 0, host: 'DESKTOP-0LH5AR4:27028', priority: 2}, {_id: 1, host: 'CTY9-SP-KHOI:27029', priority: 1}, {_id: 2, host: 'DESKTOP-O4RE9KS:27030', priority: 1}]})"
```

Đợi ~30 giây cho tất cả replica sets ổn định.

### Bước 6: Start mongos Router (1 phút)

**Máy 1 (LAPTOP-8AOJN7HN):**
```powershell
mongos --configdb "configrs/DESKTOP-0LH5AR4:27019,CTY9-SP-KHOI:27020,DESKTOP-O4RE9KS:27021" --port 27017 --bind_ip 0.0.0.0
```

### Bước 7: Configure Sharding (3 phút)

**Trên Máy 1, terminal mới:**

```powershell
# 1. Add shards (mỗi shard gồm 3 nodes phân tán trên 3 máy)
mongosh --port 27017 --eval "sh.addShard('shard1rs/DESKTOP-0LH5AR4:27022,CTY9-SP-KHOI:27023,DESKTOP-O4RE9KS:27024')"
mongosh --port 27017 --eval "sh.addShard('shard2rs/DESKTOP-0LH5AR4:27025,CTY9-SP-KHOI:27026,DESKTOP-O4RE9KS:27027')"
mongosh --port 27017 --eval "sh.addShard('shard3rs/DESKTOP-0LH5AR4:27028,CTY9-SP-KHOI:27029,DESKTOP-O4RE9KS:27030')"

# 2. Enable sharding
mongosh --port 27017 --eval "sh.enableSharding('socialnetwork')"

# 3. Setup sharding cho collections
cd backend
node scripts/setup-sharding.js

npm run seed:admin

# 4. Verify
mongosh --port 27017 --eval "sh.status()"
```

### Bước 8: Setup Neo4j và Web App (5 phút)

**Trên Máy 1:**
1. **Neo4j Desktop**: 
   - Tạo database: `socialnetwork`
   - Password: `password123` 
   - Start database

2. **Web App**:
   - Cấu hình `.env` với MongoDB connection string
   - Start backend và frontend

---

## ✅ Kiểm tra hoạt động

### Test Cluster Status

**Từ Máy 1:**
```powershell
# 1. Kiểm tra config replica set
mongosh --host DESKTOP-0LH5AR4 --port 27019 --eval "rs.status()"

# 2. Kiểm tra shard1 replica set (node1 trên Máy 2)
mongosh --host DESKTOP-0LH5AR4 --port 27022 --eval "rs.status()"

# 3. Kiểm tra shard2 replica set (node1 trên Máy 2)
mongosh --host DESKTOP-0LH5AR4 --port 27025 --eval "rs.status()"

# 4. Kiểm tra shard3 replica set (node1 trên Máy 2)
mongosh --host DESKTOP-0LH5AR4 --port 27028 --eval "rs.status()"

# 5. Kiểm tra cluster sharding
mongosh --port 27017 --eval "sh.status()"

# 6. Test MongoDB connection
cd backend
npm run test-mongodb

# 7. Test Neo4j connection
npm run test-neo4j
```

### Truy cập services:
- **Web App**: http://LAPTOP-8AOJN7HN:3000
- **MongoDB Router**: mongodb://LAPTOP-8AOJN7HN:27017/socialnetwork
- **Neo4j Browser**: http://LAPTOP-8AOJN7HN:7474

---

## 💡 Tổng kết

**Cluster Architecture:**
- 13 MongoDB processes (3 config + 9 shards + 1 mongos)
- Phân bố: Máy 1 (mongos), Máy 2-4 (mỗi máy 4 processes)
- **MỖI SHARD phân tán trên 3 máy khác nhau** → True High Availability

**Phân tán Replica Sets:**
```
Shard1-RS: Node1 (Máy 2) + Node2 (Máy 3) + Node3 (Máy 4)
Shard2-RS: Node1 (Máy 2) + Node2 (Máy 3) + Node3 (Máy 4)
Shard3-RS: Node1 (Máy 2) + Node2 (Máy 3) + Node3 (Máy 4)
Config-RS:  Node1 (Máy 2) + Node2 (Máy 3) + Node3 (Máy 4)
```

**Setup Time:** ~30 phút

**High Availability:**
- ✅ Tắt Máy 2 → Mỗi shard vẫn có 2/3 nodes (Máy 3, 4) → Data accessible
- ✅ Tắt Máy 3 → Mỗi shard vẫn có 2/3 nodes (Máy 2, 4) → Data accessible
- ✅ Tắt Máy 4 → Mỗi shard vẫn có 2/3 nodes (Máy 2, 3) → Data accessible
- ✅ Automatic failover khi primary node down (~10-15 giây)
---

## 🚀 Test High Availability

### Scenario 1: Tắt 1 máy (Cluster vẫn hoạt động)

```powershell
# 1. Test baseline - kiểm tra cluster health
mongosh --port 27017 --eval "sh.status()"

# 2. Tắt toàn bộ Máy 2 (Config1 + Node1 của tất cả shards)
# Trên Máy 2: Stop tất cả mongod processes
# Hoặc tắt máy/mất kết nối mạng

# 3. Verify data vẫn accessible từ Máy 1
mongosh --port 27017 --eval "db.getSiblingDB('socialnetwork').users.find().limit(5)"

# 4. Kiểm tra từng shard - mỗi shard còn 2/3 nodes
mongosh --host CTY9-SP-KHOI --port 27023 --eval "rs.status()"  # Shard1
mongosh --host CTY9-SP-KHOI --port 27026 --eval "rs.status()"  # Shard2
mongosh --host CTY9-SP-KHOI --port 27029 --eval "rs.status()"  # Shard3

# 5. Restart Máy 2 - tất cả nodes tự động rejoin
```

**Kết quả:**
- ✅ Tất cả shards vẫn hoạt động (mỗi shard còn 2/3 nodes trên Máy 3,4)
- ✅ Config servers vẫn có đa số (2/3 nodes)
- ✅ Data VẪN accessible
- ✅ Automatic failover khi primary down (~10-15 giây)

### Scenario 2: Tắt 2 máy (Cluster read-only)

```powershell
# 1. Tắt Máy 2 và Máy 3
# Trên mỗi máy: Stop tất cả mongod processes

# 2. Verify cluster read-only
mongosh --port 27017 --eval "db.getSiblingDB('socialnetwork').users.find().limit(5)"
# → Có thể đọc (nếu cached)

mongosh --port 27017 --eval "db.getSiblingDB('socialnetwork').users.insertOne({name: 'Test'})"
# → KHÔNG thể ghi (chỉ còn 1/3 nodes)

# 3. Restart Máy 2 hoặc Máy 3 - cluster hoạt động trở lại
```

**Kết quả:**
- ❌ Mỗi shard chỉ còn 1/3 nodes → Không đạt majority
- ❌ Không thể ghi (cần đa số nodes để bầu primary)
- ⚠️ Có thể đọc cached data nhưng không reliable
- ✅ Restart 1 trong 2 máy → Cluster hoạt động trở lại