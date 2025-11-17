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
- ✅ Test failover bằng "máy ảo" (gộp nodes theo máy)
- ✅ Giả lập production: Tắt 1 máy ảo → Mỗi shard còn 2/3 nodes
- ⚠️ Tất cả processes trên cùng 1 máy vật lý (không phải HA thật)

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

## 🔍 Khác biệt chính: Phân tán Nodes

### Local vs Production - Cách phân bố nodes

**Local (Giả lập bằng "Máy ảo"):**
```
Máy ảo 1 (processes):  Config1 + Shard1-N1 + Shard2-N1 + Shard3-N1
Máy ảo 2 (processes):  Config2 + Shard1-N2 + Shard2-N2 + Shard3-N2
Máy ảo 3 (processes):  Config3 + Shard1-N3 + Shard2-N3 + Shard3-N3

→ Tắt "Máy ảo 1" (4 processes) → Mỗi shard còn 2/3 nodes → ✅ Data OK
→ NHƯNG: Tất cả trên 1 máy vật lý → Máy chết = mất hết
```

**Production (Phân tán thật):**
```
Máy 2 (vật lý):  Config1 + Shard1-N1 + Shard2-N1 + Shard3-N1
Máy 3 (vật lý):  Config2 + Shard1-N2 + Shard2-N2 + Shard3-N2
Máy 4 (vật lý):  Config3 + Shard1-N3 + Shard2-N3 + Shard3-N3

→ Tắt Máy 2 → Mỗi shard còn 2/3 nodes → ✅ Data OK
→ Máy 3, 4 vẫn chạy → True High Availability
```

### Ví dụ: Tắt 1 máy

**Shard1-RS trong Local:**
```
Node1 (port 27022) ◄── Process 1 trên máy local
Node2 (port 27023) ◄── Process 2 trên máy local  
Node3 (port 27024) ◄── Process 3 trên máy local

Tắt "Máy ảo 1" (stop process port 27022):
→ Shard1 còn Node2 + Node3 → ✅ OK
```

**Shard1-RS trong Production:**
```
Node1 (Máy 2, port 27022) ◄── Máy vật lý riêng
Node2 (Máy 3, port 27023) ◄── Máy vật lý riêng
Node3 (Máy 4, port 27024) ◄── Máy vật lý riêng

Tắt Máy 2:
→ Shard1 còn Node2 (Máy 3) + Node3 (Máy 4) → ✅ OK
```

**Behavior giống nhau** - Đều mô phỏng tắt 1 trong 3 "máy"

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
