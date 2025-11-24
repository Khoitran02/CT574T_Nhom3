# CT574T - Nhóm 3
## MongoDB Sharded Cluster + Neo4j – Mạng xã hội mini

## Mô tả dự án
Ứng dụng mạng xã hội fullstack với kiến trúc cơ sở dữ liệu phân tán, kết hợp MongoDB Sharded Cluster và Neo4j Graph Database. Dự án tập trung vào việc nghiên cứu và triển khai hệ thống cơ sở dữ liệu phân tán cho ứng dụng thực tế.

## Kiến trúc hệ thống

### Frontend
- **React** - Modern UI library
- **Vite** - Fast build tool và development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Data fetching và state management
- **Axios** - HTTP client
- **Lucide React** - Icon library

### Backend
- **Node.js + Express** - RESTful API server
- **Mongoose** - MongoDB ODM
- **Neo4j Driver** - Graph database client
- **Morgan** - HTTP request logger
- **Dotenv** - Environment configuration

### Database
- **MongoDB Sharded Cluster** - Document storage (Users, Posts, Comments)
- **Neo4j** - Graph database (User relationships: FOLLOWS)

## Yêu cầu hệ thống

### Development (1 máy)
- **Windows 10/11** - RAM 4GB+
- **MongoDB Community Server 8.0+** - Full installation
- **Neo4j Desktop 5.15+** - Graph database
- **Node.js 18.x+** - Runtime environment
- **PowerShell 5.1+** - Script automation

### Production (4 máy LAN)
- **Windows 10/11** - RAM 4GB+ mỗi máy
- **MongoDB Community Server 8.0+** - Distributed cluster
- **Neo4j Community 5.15+** - Graph database
- **Node.js 18.x+** - Runtime environment

## Mô hình triển khai

### **MongoDB Sharded Cluster với Replica Sets**
- **Kiến trúc**: 3 shards × 3 nodes = High Availability
- **Local Development**: 1 máy Windows (13 processes)
- **Production**: 4 máy Windows LAN (phân tán replica sets)
- **Setup time**: ~10 phút (local), ~30 phút (production)
- **Tài nguyên**: ~3-4 GB RAM (local), phân tán 4 máy (production)
- **Hướng dẫn**: [docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md) | [docs/PRODUCTION_SETUP.md](docs/PRODUCTION_SETUP.md)

---

## ⚡ Quick Start

### Local Development

#### 1. Clone và cài đặt
```powershell
git clone [repo-url]
cd CT574T_Nhom3
npm run install-all
```

#### 2. Start MongoDB Cluster (HA)
(Ưu tiên chạy bằng quyền admin)
```powershell
.\script\start-mongodb-cluster-ha.ps1
```

#### 3. Setup và Seed
```powershell
cd backend
node scripts/setup-sharding.js
// tạo admin user
npm run seed:admin
```

#### 4. Setup Neo4j
- Mở **Neo4j Desktop**
- Tạo database mới hoặc start database có sẵn
- Mặc định: `http://localhost:7474` (neo4j/password123)
- Cấu hình trong `backend/.env`

#### 5. Khởi động ứng dụng
```powershell
# Chạy fullstack (Frontend + Backend)
cd ..
npm run dev
```

### Production (4 máy LAN)
Chi tiết: [docs/PRODUCTION_SETUP.md](docs/PRODUCTION_SETUP.md)

### Các URL quan trọng
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **MongoDB Router**: mongodb://localhost:27017
- **Neo4j Browser**: http://localhost:7474

## Cấu Trúc Hệ Thống

### Phân Quyền

#### **Admin Role**
- Được lưu trữ **chỉ trong MongoDB**
- Truy cập Admin Panel tại `/admin/*`
- Quản lý toàn bộ users, posts, và database

#### **User Role**  
- Được lưu trữ trong **cả MongoDB và Neo4j**
- Truy cập trang chính tại `/`
- Đăng ký, đăng nhập, đăng bài, follow users

### Routing

#### Public Routes
- `/login` - Đăng nhập / Đăng ký

#### User Routes
- `/` - News Feed (Feed.jsx)

#### Admin Routes (với prefix `/admin`)
- `/admin` - Dashboard
- `/admin/users` - Quản lý users
- `/admin/posts` - Quản lý posts
- `/admin/network` - Xem mạng xã hội
- `/admin/database` - Database status

## Scripts có sẵn

```powershell
# Root scripts
npm run install-all    # Cài đặt dependencies cho tất cả
npm run dev           # Chạy fullstack (frontend + backend)
npm run backend       # Chạy riêng backend
npm run frontend      # Chạy riêng frontend
npm run build         # Build production frontend
npm run test-databases # Test kết nối databases

# Backend scripts (cd backend)
npm start             # Start backend server
npm run dev          # Start với nodemon (auto-reload)
npm run seed:admin         # Seed admin user
npm run test-mongodb # Test MongoDB connection
npm run test-neo4j   # Test Neo4j connection
npm run test-failover # Test shard failover

# MongoDB Sharding scripts (cd backend)
node scripts/setup-sharding.js              # Setup sharding cho collections
node scripts/check-shard-location.js <collection> <id>  # Kiểm tra record ở shard nào
node scripts/check-shard-location.js --direct <collection> <id>  # Query trực tiếp shards
node scripts/check-shard-location.js --list-shards      # Liệt kê shards

# High Availability Testing (script/)
.\script\start-mongodb-cluster-ha.ps1         # Start HA cluster (13 processes)
.\script\stop-machine.ps1 -MachineNumber <1-3>  # Tắt "máy ảo" (Config + Node của 3 shards)
.\script\start-machine.ps1 -MachineNumber <1-3> # Start lại "máy ảo"
.\script\cleanup-mongodb-ha.ps1              # Cleanup HA cluster
.\script\cleanup-mongodb-ha.ps1 -KeepData              # Chỉ stop processes, KHÔNG xóa C:\MongoDB-Dev-HA

# Frontend scripts (cd frontend)
npm run dev          # Start dev server (Vite)
npm run build        # Build production
npm run preview      # Preview production build
```

### Sharding Strategy (MongoDB 8.2+)

**Collections Sharded:**
- **users**: Shard key = `_id` (hashed) - Phân bố đều users
- **posts**: Shard key = `authorId` (hashed) - Phân bố đều posts
- **comments**: Shard key = `postId` (hashed) - Phân bố đều comments

**Workflow Setup:**
1. Start cluster → 2. Setup sharding → 3. Seed data → 4. Chunks tự động tạo

**Kiểm tra sharding:**
```bash
node backend/scripts/check-shard-location.js --direct users <user_id>
```

**Test Shard Failover:**

### Scenario 1: Tắt 1 máy (Cluster vẫn hoạt động)
```powershell
# Tắt Máy 1 (Node1 của tất cả shards)
.\script\stop-machine.ps1 1

# Kiểm tra trạng thái
npm run test-failover
# → Mỗi shard còn 2/3 nodes
# → Data VẪN accessible ✅

# Khởi động lại
.\script\start-machine.ps1 1
```

### Scenario 2: Tắt 2 máy (Cluster read-only)
```powershell
# Tắt Máy 1 và Máy 2
.\script\stop-machine.ps1 1
.\script\stop-machine.ps1 2

# Kiểm tra trạng thái
npm run test-failover
# → Mỗi shard chỉ còn 1/3 nodes
# → KHÔNG thể ghi (cần đa số nodes)
# → API trả về HTTP 503

# Khởi động lại
.\script\start-machine.ps1 1
.\script\start-machine.ps1 2
```

**Lưu ý:**
- Mỗi shard có 3 nodes phân bố trên 3 máy ảo
- Tắt 1 máy → Mỗi shard còn 2/3 nodes → ✅ Hoạt động bình thường
- Tắt 2 máy → Chỉ còn 1/3 nodes → ❌ Không thể ghi (cần majority)
- Automatic failover khi primary down (~10-15 giây)

## Lưu Ý Quan Trọng

1. **Password Security**: Passwords được hash bằng bcrypt với salt rounds = 10

2. **Neo4j for Users Only**: Chỉ user role được tạo node trong Neo4j, admin không cần vì không tham gia social network

3. **Follow là 1 chiều**: User A follow User B không tự động tạo follow ngược lại

4. **Session Management**: Hiện tại sử dụng localStorage, trong production nên dùng JWT

5. **Form Labels**: Tất cả modal forms đã được chuẩn hóa với label text-left

## License
Dự án học tập - CT574T Cơ sở dữ liệu nâng cao

---
*Nhóm 3 - CT574T - Thạc sĩ Khoa học máy tính 2025-2027*