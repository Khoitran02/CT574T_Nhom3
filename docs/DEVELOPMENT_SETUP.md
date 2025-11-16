# Development Setup
## 🎯 Mô hình Development: MongoDB HA Cluster (1 máy)

### Kiến trúc
- **MongoDB HA Cluster**: 13 processes (3 config + 9 shards + 1 mongos)
- **Replica Sets**: Mỗi shard có 3 nodes → Automatic failover
- **Native Windows**: Web App + Neo4j + MongoDB Cluster

**Chi tiết kiến trúc MongoDB HA Cluster:**
- 13 processes: 3 config + 9 shards (3×3 replica sets) + 1 mongos
- Ports: Config (27019-27021), Shards (27022-27030), Router (27017)

### Yêu cầu
- MongoDB Community Server 8.2+
- Neo4j Desktop  
- Node.js 18+
- Windows 10/11, RAM 4GB+
- PowerShell 5.1+

---

## ⚡ Quick Start (3 phút)

```powershell
# Cd vào thư mục dự án trước. Ưu tiên chạy powershell với quyền admin
# 1. Start MongoDB HA cluster
.\script\start-mongodb-cluster-ha.ps1

# 2. Setup sharding và seed
cd backend
node script/setup-sharding.js
npm run seed

# 3. Start backend
npm run dev 

# 4. Start frontend (terminal mới)
cd ../frontend
npm run dev
```

**Truy cập:** http://localhost:5173

---

## 🚀 Setup từng bước (10 phút)

### Bước 1: Chuẩn bị môi trường
```powershell
git clone [repo-url]  
cd CT574T_Nhom3
npm run install-all
```

### Bước 2: Start MongoDB HA Cluster
```powershell
# Cd vào thư mục dự án trước. Ưu tiên chạy powershell với quyền admin
.\script\start-mongodb-cluster-ha.ps1
```

### Bước 3: Setup Sharding và Seed
```powershell
cd backend
node script/setup-sharding.js
npm run seed
```

### Bước 4: Setup Neo4j
- Mở Neo4j Desktop
- Tạo database: `socialnetwork`
- Password: `password123`
- Start database

### Bước 5: Start Ứng dụng
```powershell
# Backend
npm run dev

# Frontend (terminal mới)
cd ../frontend
npm run dev
```

---

## ✅ Kiểm tra hoạt động

```powershell
# 1. Test cluster connectivity
mongosh --port 27017 --eval "sh.status()"

# 2. Test databases
cd backend
npm run test-mongodb
npm run test-neo4j
```

**Truy cập:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Neo4j Browser: http://localhost:7474

---

## 🧹 Cleanup

```powershell
# Stop cluster và xóa data
.\script\cleanup-mongodb-ha.ps1

# Stop cluster nhưng giữ data
.\script\cleanup-mongodb-ha.ps1 -KeepData
```

---

## 🚀 Test High Availability

### Scenario 1: Tắt 1 máy (Cluster vẫn hoạt động)

```powershell
# 1. Test baseline
npm run test-failover

# 2. Tắt Máy ảo 1 (Node1 của tất cả shards)
.\script\stop-machine.ps1 1

# 3. Verify data vẫn accessible
npm run test-failover
# → Mỗi shard còn 2/3 nodes
# → Data VẪN accessible ✅

# 4. Khởi động lại
.\script\start-machine.ps1 1
```

### Scenario 2: Tắt 2 máy (Cluster read-only)

```powershell
# 1. Tắt Máy ảo 1 và 2
.\script\stop-machine.ps1 1
.\script\stop-machine.ps1 2

# 2. Verify cluster read-only
npm run test-failover
# → Mỗi shard chỉ còn 1/3 nodes
# → KHÔNG thể ghi (cần đa số nodes)
# → API trả về HTTP 503

# 3. Khởi động lại
.\script\start-machine.ps1 1
.\script\start-machine.ps1 2
```

**Kết quả:**
- ✅ Tắt 1 máy → Mỗi shard còn 2/3 nodes → Hoạt động bình thường
- ❌ Tắt 2 máy → Chỉ còn 1/3 nodes → Không thể ghi (cần majority)
- ✅ Automatic failover khi primary down (~10-15 giây)