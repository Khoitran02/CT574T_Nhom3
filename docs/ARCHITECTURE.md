# MongoDB Sharded Cluster - Architecture Overview

## 🏗️ Kiến trúc tổng quan

### Khái niệm cơ bản

**Sharding** = Phân vùng dữ liệu ngang (horizontal partitioning)
- Data được chia nhỏ thành các chunks
- Mỗi chunk được lưu trên 1 shard cụ thể
- VD: User A ở shard1, User B ở shard2, User C ở shard3

**Replica Set** = Sao chép dữ liệu dọc (vertical replication)
- Mỗi shard có nhiều bản sao (replicas)
- 1 Primary (ghi), 2 Secondary (đọc + backup)
- Automatic failover khi primary down

---

## 📊 So sánh 2 mô hình

### Mô hình 1: Local Development (1 máy)

```
┌─────────────────────────────────────────────────────┐
│                    Máy Local                         │
│                                                      │
│  Shard1-RS: Node1 ──┬── Node2 ── Node3              │
│  Shard2-RS: Node1 ──┼── Node2 ── Node3              │
│  Shard3-RS: Node1 ──┼── Node2 ── Node3              │
│  Config-RS: Node1 ──┼── Node2 ── Node3              │
│  mongos Router ─────┘                                │
│                                                      │
│  Total: 13 processes trên CÙNG 1 máy                 │
└─────────────────────────────────────────────────────┘
```

**Đặc điểm:**
- ✅ Dễ setup (1 script chạy xong)
- ✅ Test sharding logic
- ✅ Test replica set failover (node level)
- ❌ **KHÔNG thể test machine-level failover**
- ❌ Tắt shard1 (cả 3 nodes) → **Mất toàn bộ data shard1**

**Ports:**
- Config: 27019, 27020, 27021
- Shard1: 27022, 27023, 27024
- Shard2: 27025, 27026, 27027
- Shard3: 27028, 27029, 27030
- Router: 27017

---

### Mô hình 2: Production (4 máy)

```
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Máy 1      │  │      Máy 2       │  │      Máy 3       │  │      Máy 4       │
│              │  │                  │  │                  │  │                  │
│  mongos      │  │  Config1         │  │  Config2         │  │  Config3         │
│  Web App     │  │  Shard1-Node1    │  │  Shard1-Node2    │  │  Shard1-Node3    │
│  Neo4j       │  │  Shard2-Node1    │  │  Shard2-Node2    │  │  Shard2-Node3    │
│              │  │  Shard3-Node1    │  │  Shard3-Node2    │  │  Shard3-Node3    │
│              │  │                  │  │                  │  │                  │
│ 1 process    │  │  4 processes     │  │  4 processes     │  │  4 processes     │
└──────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
                           │                     │                     │
                           └─────────────────────┴─────────────────────┘
                                    Mỗi shard phân tán 3 máy
```

**Đặc điểm:**
- ✅ True High Availability
- ✅ Tắt BẤT KỲ 1 máy nào → Tất cả shards vẫn hoạt động
- ✅ Automatic failover (machine level)
- ✅ Load balancing

**Ports:**
- Máy 2: Config1 (27019), Shard*-N1 (27022, 27025, 27028)
- Máy 3: Config2 (27020), Shard*-N2 (27023, 27026, 27029)
- Máy 4: Config3 (27021), Shard*-N3 (27024, 27027, 27030)

---

## 🔍 Tại sao Production khác Local?

### Câu hỏi: "Tắt shard1 thì sao không connect được replica set?"

**Trong Local:**
```
Shard1-RS:
├── Node1 (port 27022) ◄── Cùng máy
├── Node2 (port 27023) ◄── Cùng máy
└── Node3 (port 27024) ◄── Cùng máy

→ Tắt cả 3 nodes → MongoDB không tìm thấy PRIMARY
→ Error: "Could not find host matching read preference"
```

**Trong Production:**
```
Shard1-RS:
├── Node1 (Máy 2, port 27022) ◄── Tắt Máy 2
├── Node2 (Máy 3, port 27023) ◄── VẪN HOẠT ĐỘNG
└── Node3 (Máy 4, port 27024) ◄── VẪN HOẠT ĐỘNG

→ Tắt Máy 2 → Còn 2/3 nodes
→ Node2 hoặc Node3 trở thành PRIMARY
→ Data vẫn accessible!
```

---

## 💡 Test Failover trong Local

### Giả lập Production bằng "Máy ảo"

Local setup có thể **mô phỏng** production bằng cách gộp nodes theo máy ảo:

```
Máy ảo 1: Config1 + Shard1-N1 + Shard2-N1 + Shard3-N1 (ports 27019,27022,27025,27028)
Máy ảo 2: Config2 + Shard1-N2 + Shard2-N2 + Shard3-N2 (ports 27020,27023,27026,27029)
Máy ảo 3: Config3 + Shard1-N3 + Shard2-N3 + Shard3-N3 (ports 27021,27024,27027,27030)
```

### Scripts đã tối ưu:

```powershell
# Tắt "Máy ảo 1" (4 processes)
.\script\stop-machine.ps1 1
# → Mỗi shard còn 2/3 nodes → ✅ Data accessible

# Tắt "Máy ảo 2" (4 processes)
.\script\stop-machine.ps1 2
# → Mỗi shard còn 2/3 nodes → ✅ Data accessible

# Tắt CẢ 2 máy ảo (chỉ còn 1/3 nodes)
.\script\stop-machine.ps1 1
.\script\stop-machine.ps1 2
# → Mỗi shard chỉ còn 1/3 nodes → ❌ KHÔNG thể ghi (cần majority)

# Khởi động lại
.\script\start-machine.ps1 1
.\script\start-machine.ps1 2
```

### Khi nào data KHÔNG accessible?

**Local (giả lập máy ảo):**
- ❌ Tắt 2/3 máy ảo → Mỗi shard chỉ còn 1/3 nodes → Không đạt majority
- ✅ Tắt 1 máy ảo → Mỗi shard còn 2/3 nodes → Data vẫn OK

**Production:**
- ❌ Tắt 2/3 máy (VD: Máy 2 + Máy 3) → Mỗi shard chỉ còn 1/3 nodes → Không đạt majority
- ✅ Tắt 1 máy bất kỳ → Mỗi shard còn 2/3 nodes → Data vẫn OK

---

## 🎯 Failover Behavior với Read Preference

### Cấu hình đã thêm:

```javascript
// backend/config/mongodb.js
{
  readPreference: 'primaryPreferred',  // Ưu tiên primary, fallback sang secondary
  retryReads: true,                    // Tự động retry khi read fail
  retryWrites: true                    // Tự động retry khi write fail
}
```

### Behavior:

**Khi tất cả nodes của shard1 down:**
1. MongoDB router (mongos) nhận query user thuộc shard1
2. Thử connect tới shard1rs → Không tìm thấy primary
3. **Timeout sau 10 giây** (maxTimeMS)
4. API trả về HTTP 503 "Service temporarily unavailable"

**Khi chỉ 1-2 nodes của shard1 down (Production):**
1. MongoDB router connect tới node còn sống
2. Primary election tự động (~10-15 giây)
3. Data accessible bình thường
4. User không nhận thấy downtime

---

## 📝 Kết luận

| Khía cạnh | Local (Dev) | Production (4 máy) |
|-----------|-------------|---------------------|
| **Setup** | 1 script | ~30 phút |
| **Tài nguyên** | 1 máy, 4GB RAM | 4 máy, 4GB/máy |
| **Machine failover** | ❌ Không | ✅ Có |
| **Node failover** | ✅ Có | ✅ Có |
| **Use case** | Development, Testing | Production |
| **Data safety** | Medium | High |

**Khuyến nghị:**
- Development: Dùng local setup để test logic
- Production: **BẮT BUỘC** dùng mô hình phân tán để đảm bảo HA thực sự
