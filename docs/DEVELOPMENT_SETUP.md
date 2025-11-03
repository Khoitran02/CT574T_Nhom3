# Development Setup
## 🎯 Mô hình Development: 1 máy Native MongoDB Cluster

Dành cho: **Development, Testing, Learning MongoDB Sharding**

### Kiến trúc
- **Native MongoDB**: 6 processes (3 config servers + 3 shards + 1 mongos)
- **Native Windows**: Web App + Neo4j + MongoDB Cluster

### Tại sao Native MongoDB?
- **🎯 100% giống Production**: Cùng architecture và commands với production
- **🔧 Dễ debug**: Tất cả processes native, monitor bằng Task Manager  
- **⚡ Performance**: Native processes, tối ưu cho Windows
- **🎓 Educational**: Hiểu sâu MongoDB cluster architecture thực tế
- **🚀 Demo-ready**: Dễ dàng scale lên 3 máy cho demo production

### Yêu cầu
- MongoDB Community Server 8.2+ (bao gồm mongod, mongos, mongosh)
- Neo4j Desktop  
- Node.js 18+
- Windows 10/11, RAM 4GB+
- PowerShell 5.1+

---

## ⚡ Quick Start (2 phút)

**Cách nhanh nhất - chỉ cần 3 lệnh:**
```powershell
# 1. Right-click PowerShell → "Run as Administrator"
cd "D:\Study\ThS_2025-2027\CT574T-Co_so_du_lieu_nang_cao\Source\CT574T_Nhom3"

# 2. Install dependencies
npm install

# 3. Start MongoDB cluster
.\script\start-mongodb-cluster.ps1 -Verbose
```

> **Script sẽ tự động**: Tạo data directories → Start 7 processes → Configure cluster → Test sharding

---

## 🚀 Setup từng bước (5 phút)

### Bước 1: Chuẩn bị môi trường (1 phút)
```powershell
# Clone project và chuẩn bị
git clone [repo-url]  
cd CT574T_Nhom3
npm install

# Tạo thư mục dữ liệu cho MongoDB cluster
mkdir C:\MongoDB-Dev -Force
mkdir C:\MongoDB-Dev\data\config1, C:\MongoDB-Dev\data\config2, C:\MongoDB-Dev\data\config3 -Force
mkdir C:\MongoDB-Dev\data\shard1, C:\MongoDB-Dev\data\shard2, C:\MongoDB-Dev\data\shard3 -Force
mkdir C:\MongoDB-Dev\logs -Force
```

### Bước 2: Khởi động MongoDB Cluster tự động (1 phút)

**⭐ Recommended: Run PowerShell as Administrator** (Tránh mọi permission issues)
```powershell
# 1. Right-click PowerShell → "Run as Administrator"
# 2. Navigate to project directory
cd "D:\Study\ThS_2025-2027\CT574T-Co_so_du_lieu_nang_cao\Source\CT574T_Nhom3"

# 3. Start cluster (script sẽ tự động handle conflicts)
.\script\start-mongodb-cluster.ps1 -Verbose
```

**Alternative: Manual conflict resolution**
```powershell
# Kiểm tra nếu MongoDB service đang chạy (có thể conflict port 27017)
Get-Service MongoDB -ErrorAction SilentlyContinue

# Nếu có conflict, stop MongoDB service trước:
net stop MongoDB

# Sau đó chạy cluster script
.\script\start-mongodb-cluster.ps1

# Hoặc thực hiện manual (xem Phụ lục A)
```

> **Script sẽ tự động**: Start 6 MongoDB processes → Initialize replica sets → Start mongos → Configure sharding

### Bước 3: Kiểm tra cluster status (30 giây)
```powershell
# Script sẽ tự động test cluster - chỉ cần kiểm tra output
# Nếu cần test manual:
mongosh --port 27017 --eval "sh.status()"
```

### Bước 4: Setup Neo4j (1 phút)
1. **Neo4j Desktop**: Download từ https://neo4j.com/download/
2. **Create Project**: "Social Network"
3. **Add Database**: 
   - Name: `socialnetwork`
   - Password: `password123`
   - Version: 5.x
4. **Start Database**: Click "Start"

### Bước 5: Khởi động Web App (1 phút)
```powershell
# Start the web application
npm start
```

---

## ✅ Kiểm tra hoạt động

### 🎯 Quick Status Check:
```powershell
# 1. Check all processes running (should see 7: 6 mongod + 1 mongos)
Get-Process mongod, mongos -ErrorAction SilentlyContinue | Format-Table Name, Id, StartTime

# 2. Test cluster connectivity
mongosh --port 27017 --eval "db.runCommand('ping')"

# 3. Verify sharding is working
mongosh --port 27017 --eval "sh.status()"
```

**✅ Success indicators:**
- 7 MongoDB processes running 
- `db.runCommand('ping')` returns `{ ok: 1 }`
- `sh.status()` shows 3 shards active

### Truy cập services:
- **Web App**: http://localhost:3000
- **MongoDB Cluster**: mongodb://localhost:27017/socialnetwork  
- **Neo4j Browser**: http://localhost:7474 (neo4j/password123)

### Native MongoDB processes và ports:
- **Config Servers**: localhost:27019, 27020, 27021
- **Shards**: localhost:27022, 27023, 27024
- **Router (mongos)**: localhost:27017

> **Native Architecture**: Tất cả MongoDB processes chạy native trên Windows, performance tối ưu và 100% giống production.

### Test kết nối databases:

```powershell
# 1. Test MongoDB cluster
node test-mongodb.js

# 2. Test Neo4j connection  
node test-neo4j.js

# 3. Start web application
npm start
```

### Dấu hiệu thành công:
- ✅ 7 MongoDB processes đang chạy (6 mongod + 1 mongos)
- ✅ `sh.status()` hiển thị 3 shards active
- ✅ `getShardDistribution()` cho thấy dữ liệu phân bố across shards
- ✅ Web app accessible tại localhost:3000
- ✅ Neo4j Browser accessible tại localhost:7474
- ✅ Task Manager hiển thị 7 MongoDB processes



---

## �️ Troubleshooting

### Lỗi thường gặp:

**1. Port conflicts (MongoDB Service running)**

**⭐ Best Solution: Run as Administrator**
```powershell
# Right-click PowerShell → "Run as Administrator"
cd "D:\Study\ThS_2025-2027\CT574T-Co_so_du_lieu_nang_cao\Source\CT574T_Nhom3"

# Complete cleanup and restart
.\script\cleanup-mongodb.ps1 -Force
.\script\start-mongodb-cluster.ps1 -Verbose
```

**Manual Resolution:**
```powershell
# Check if MongoDB service is running
Get-Service MongoDB -ErrorAction SilentlyContinue

# Stop MongoDB service (requires Admin rights)
net stop MongoDB

# Check what's using ports  
netstat -ano | findstr ":27017 :27019"

# Kill specific processes if needed
Get-Process mongod, mongos -ErrorAction SilentlyContinue | Stop-Process -Force

# Restart cluster
.\script\start-mongodb-cluster.ps1
```

**2. Process startup issues**
```powershell
# Check process logs (check data directory for log files)
Get-Content "data\configsvr1\mongod.log" -Tail 20
Get-Content "data\shard1\mongod.log" -Tail 20

# Restart specific processes (kill and restart cluster)
.\script\cleanup-mongodb.ps1
.\script\start-mongodb-cluster.ps1
```

**3. Replica set initialization failed**
```powershell
# Wait for processes to be ready
Start-Sleep 30

# Check replica set status
mongosh --port 27019 --eval "rs.status()"
mongosh --port 27022 --eval "rs.status()"

# Re-initialize if needed
mongosh --port 27019 --eval "rs.initiate({_id: 'configrs', configsvr: true, members: [{_id: 0, host: 'localhost:27019'}, {_id: 1, host: 'localhost:27020'}, {_id: 2, host: 'localhost:27021'}]})"
```

**4. MongoDB Connection Issues**
```powershell
# Check if all MongoDB processes are running
netstat -ano | findstr ":27019 :27020 :27021 :27022 :27023 :27024"
Get-Process mongod, mongos -ErrorAction SilentlyContinue

# Verify replica sets status
mongosh --port 27019 --eval "rs.status()"
mongosh --port 27022 --eval "rs.status()"

# Check log files for errors
Get-Content C:\MongoDB-Dev\logs\configsvr1.log -Tail 5
```

**5. Sharding not working**
```powershell
# Check mongos process
Get-Process mongos -ErrorAction SilentlyContinue

# Verify shards are added
mongosh --port 27017 --eval "sh.status()"

# Re-add shards if needed  
mongosh --port 27017 --eval "sh.addShard('shard1rs/localhost:27022')"
mongosh --port 27017 --eval "sh.addShard('shard2rs/localhost:27023')"
mongosh --port 27017 --eval "sh.addShard('shard3rs/localhost:27024')"
```

### Quick cleanup & restart:
```powershell
# Complete reset using cleanup script
.\script\cleanup-mongodb.ps1

# Complete reset using cleanup script (No clear Data)
 .\script\cleanup-mongodb.ps1 -KeepData -Force

# Fresh restart
.\script\start-mongodb-cluster.ps1
```

---

## 📋 Development Checklist

- [ ] **MongoDB**: MongoDB Community Server 8.2+ installed
- [ ] **Project**: Code cloned and dependencies installed  
- [ ] **Processes**: 7 MongoDB processes running (6 mongod + 1 mongos)
- [ ] **Replica Sets**: Config and shard replica sets initialized
- [ ] **Sharding**: Cluster configured and collections sharded
- [ ] **Neo4j**: Desktop running with socialnetwork database
- [ ] **Web App**: Application started and accessible
- [ ] **Testing**: All health checks passing

**Setup Time**: ~5 phút (automated với scripts)
**Memory Usage**: ~1.5-2 GB RAM (native processes)  
**Cleanup**: `.\script\cleanup-mongodb.ps1`
**Benefits**: Native performance, 100% giống production, automated scripts

**Perfect for**: Development, Testing, Learning MongoDB Sharding, Production Demo

---

## 📚 Phụ lục A: Manual Setup Commands

Nếu bạn muốn hiểu từng bước manual thay vì dùng script:

### A1. Manual MongoDB Cluster Commands (đồng bộ với script)

> **Lưu ý**: Các lệnh sau đây được extract từ `start-mongodb-cluster.ps1`. 
> Khuyến nghị sử dụng script thay vì chạy manual.

```powershell
# 0. Check port conflicts first
$criticalPorts = @(27017, 27019, 27020, 27021, 27022, 27023, 27024)
foreach ($port in $criticalPorts) {
    netstat -ano | findstr ":$port "
}

# 1. Create data directories
mkdir C:\MongoDB-Dev\data\config1, C:\MongoDB-Dev\data\config2, C:\MongoDB-Dev\data\config3 -Force
mkdir C:\MongoDB-Dev\data\shard1, C:\MongoDB-Dev\data\shard2, C:\MongoDB-Dev\data\shard3 -Force  
mkdir C:\MongoDB-Dev\logs -Force

# 2. Start Config Servers (wait 3s between each)
Start-Process -FilePath "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" -ArgumentList "--configsvr --replSet configrs --port 27019 --dbpath `"C:\MongoDB-Dev\data\config1`" --bind_ip 127.0.0.1 --logpath `"C:\MongoDB-Dev\logs\configsvr1.log`"" -WindowStyle Minimized
Start-Sleep 3
Start-Process -FilePath "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" -ArgumentList "--configsvr --replSet configrs --port 27020 --dbpath `"C:\MongoDB-Dev\data\config2`" --bind_ip 127.0.0.1 --logpath `"C:\MongoDB-Dev\logs\configsvr2.log`"" -WindowStyle Minimized  
Start-Sleep 3
Start-Process -FilePath "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" -ArgumentList "--configsvr --replSet configrs --port 27021 --dbpath `"C:\MongoDB-Dev\data\config3`" --bind_ip 127.0.0.1 --logpath `"C:\MongoDB-Dev\logs\configsvr3.log`"" -WindowStyle Minimized
Start-Sleep 5

# 3. Wait and initialize config replica set
Start-Sleep 15
mongosh --port 27019 --eval "rs.initiate({_id: 'configrs', configsvr: true, members: [{_id: 0, host: 'localhost:27019'}, {_id: 1, host: 'localhost:27020'}, {_id: 2, host: 'localhost:27021'}]})"
Start-Sleep 10

# 4. Start Shard Servers
Start-Process -FilePath "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" -ArgumentList "--shardsvr --replSet shard1rs --port 27022 --dbpath `"C:\MongoDB-Dev\data\shard1`" --bind_ip 127.0.0.1 --logpath `"C:\MongoDB-Dev\logs\shard1.log`"" -WindowStyle Minimized
Start-Sleep 3
Start-Process -FilePath "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" -ArgumentList "--shardsvr --replSet shard2rs --port 27023 --dbpath `"C:\MongoDB-Dev\data\shard2`" --bind_ip 127.0.0.1 --logpath `"C:\MongoDB-Dev\logs\shard2.log`"" -WindowStyle Minimized
Start-Sleep 3
Start-Process -FilePath "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" -ArgumentList "--shardsvr --replSet shard3rs --port 27024 --dbpath `"C:\MongoDB-Dev\data\shard3`" --bind_ip 127.0.0.1 --logpath `"C:\MongoDB-Dev\logs\shard3.log`"" -WindowStyle Minimized  
Start-Sleep 5

# 5. Initialize shard replica sets
Start-Sleep 10
mongosh --port 27022 --eval "rs.initiate({_id: 'shard1rs', members: [{_id: 0, host: 'localhost:27022'}]})"
mongosh --port 27023 --eval "rs.initiate({_id: 'shard2rs', members: [{_id: 0, host: 'localhost:27023'}]})"
mongosh --port 27024 --eval "rs.initiate({_id: 'shard3rs', members: [{_id: 0, host: 'localhost:27024'}]})"
Start-Sleep 15

# 6. Start mongos router
Start-Process -FilePath "C:\Program Files\MongoDB\Server\8.2\bin\mongos.exe" -ArgumentList "--configdb configrs/localhost:27019,localhost:27020,localhost:27021 --port 27017 --bind_ip 127.0.0.1 --logpath `"C:\MongoDB-Dev\logs\mongos.log`"" -WindowStyle Normal
Start-Sleep 10

# 7. Configure sharding
mongosh --port 27017 --eval "sh.addShard('shard1rs/localhost:27022')"
mongosh --port 27017 --eval "sh.addShard('shard2rs/localhost:27023')"  
mongosh --port 27017 --eval "sh.addShard('shard3rs/localhost:27024')"
mongosh --port 27017 --eval "sh.enableSharding('socialnetwork')"
mongosh --port 27017 --eval "sh.shardCollection('socialnetwork.users', {user_id: 1})"
mongosh --port 27017 --eval "sh.shardCollection('socialnetwork.posts', {user_id: 1})"
mongosh --port 27017 --eval "sh.shardCollection('socialnetwork.comments', {post_id: 1})"
```

**Automated Alternative**: `.\script\start-mongodb-cluster.ps1` (khuyến nghị)