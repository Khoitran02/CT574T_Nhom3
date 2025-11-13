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

## Mô hình triển khai

### Development Environment (1 máy)

- **MongoDB Native Cluster**: 6 mongod processes + 1 mongos router
- **Neo4j Local**: Graph database instance
- **Frontend Dev Server**: Vite (port 5173)
- **Backend API Server**: Express (port 3000)

### Production Environment (4 máy LAN)

- **Máy 1**: Frontend + Backend API + MongoDB Router (mongos) + Neo4j
- **Máy 2-4**: MongoDB Sharded Cluster (3 shards với replica sets)

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

## 🚀 Hai mô hình triển khai

### 1. **Development** (Native MongoDB trên 1 máy)

- 📋 **Mục đích**: Development, Testing, Demo, Learning
- 🔧 **Yêu cầu**: MongoDB Community Server + Neo4j Desktop + PowerShell 5.1+
- ⏱️ **Setup time**: 5 phút (tự động)
- 💾 **Tài nguyên**: ~2-3 GB RAM
- 📖 **Hướng dẫn**: [docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md)

### 2. **Production** (4 máy Windows thực tế)

- 📋 **Mục đích**: Production environment, High availability
- 🖥️ **Yêu cầu**: 4 máy Windows trong cùng LAN
- ⏱️ **Setup time**: 30-45 phút
- 💾 **Tài nguyên**: Phân tán trên 4 máy
- 📖 **Hướng dẫn**: [docs/PRODUCTION_SETUP.md](docs/PRODUCTION_SETUP.md)

---

## ⚡ Quick Start

### Development (Local - 1 máy)

#### 1. Clone và cài đặt dependencies

```powershell
git clone [repo-url]
cd CT574T_Nhom3

# Cài đặt tất cả dependencies (root + backend + frontend)
npm run install-all
```

#### 2. Khởi động MongoDB Cluster

```powershell
# Start MongoDB cluster tự động (6 mongod + 1 mongos)
.\script\start-mongodb-cluster.ps1
```

#### 3. Setup Neo4j

- Mở **Neo4j Desktop**
- Tạo database mới hoặc start database có sẵn
- Mặc định: `http://localhost:7474` (neo4j/password123)
- Cấu hình trong `backend/.env`

#### 4. Khởi động ứng dụng

```powershell
# Chạy fullstack (Frontend + Backend)
npm run dev
```

### Production (4 máy LAN)

Chi tiết: [docs/PRODUCTION_SETUP.md](docs/PRODUCTION_SETUP.md)

### Các URL quan trọng

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **MongoDB Router**: mongodb://localhost:27016
- **Neo4j Browser**: http://localhost:7474

## Cấu trúc dự án

```
CT574T_Nhom3/
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/    # React components (UI, Posts, Users, Social)
│   │   ├── pages/         # Page components (Home, Users, Posts, Network, Database)
│   │   ├── services/      # API client (axios)
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   └── vite.config.js
├── backend/               # Node.js Backend
│   ├── config/           # Database configurations (MongoDB, Neo4j)
│   ├── models/           # Mongoose schemas (Users, Posts, Comments)
│   ├── routes/           # API routes
│   ├── app.js           # Express app
│   └── package.json
├── script/               # Automation scripts
│   ├── start-mongodb-cluster.ps1  # MongoDB cluster startup
│   └── neo4j/           # Neo4j setup guides
├── docs/                 # Documentation
│   ├── DEVELOPMENT_SETUP.md
│   └── PRODUCTION_SETUP.md
├── package-fullstack.json  # Root dependencies
└── README.md
```

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
npm run test-mongodb # Test MongoDB connection
npm run test-neo4j   # Test Neo4j connection

# Frontend scripts (cd frontend)
npm run dev          # Start dev server (Vite)
npm run build        # Build production
npm run preview      # Preview production build
```

## Tính năng chính

### 1. Quản lý người dùng

- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ User profile management
- ✅ Đồng bộ dữ liệu MongoDB ↔ Neo4j

### 2. Quản lý bài viết

- ✅ Tạo, sửa, xóa, xem bài viết
- ✅ Hệ thống tags
- ✅ Like/Unlike posts
- ✅ Data sharding trên MongoDB cluster

### 3. Hệ thống bình luận

- ✅ Comment trên bài viết
- ✅ Nested comments support
- ✅ Sharded storage

### 4. Mối quan hệ người dùng (Neo4j)

- ✅ Follow/Unfollow users
- ✅ Danh sách followers/following
- ✅ Graph-based relationship queries
- ✅ Social network visualization

### 5. Database Monitoring

- ✅ Real-time database status
- ✅ MongoDB cluster health check
- ✅ Neo4j connection monitoring
- ✅ Statistics dashboard

## Database Schema

### MongoDB Collections

**users** - Thông tin người dùng

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  age: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**posts** - Bài viết

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  content: String,
  tags: [String],
  likes: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**comments** - Bình luận

```javascript
{
  _id: ObjectId,
  postId: ObjectId,
  userId: ObjectId,
  content: String,
  createdAt: Date
}
```

### Neo4j Graph Schema

**User Nodes**

```cypher
(:User {
  id: String,        // MongoDB _id
  name: String,
  email: String
})
```

**Relationships**

```cypher
(:User)-[:FOLLOWS {since: DateTime}]->(:User)
```

### Sharding Strategy

- **users**: Shard key = `_id` (hash-based distribution)
- **posts**: Shard key = `userId` (posts cùng user trên 1 shard)
- **comments**: Shard key = `postId` (comments cùng post trên 1 shard)

## Troubleshooting

### MongoDB Cluster không start

```powershell
# Kiểm tra processes đang chạy
Get-Process mongod, mongos

# Stop tất cả MongoDB processes
Get-Process mongod, mongos | Stop-Process -Force

# Xóa lock files và restart
.\script\start-mongodb-cluster.ps1
```

### Neo4j connection failed

- Kiểm tra Neo4j Desktop đã start database chưa
- Verify credentials trong `backend/.env`
- Mặc định: `neo4j://localhost:7687`, user: `neo4j`, password: `pass1234`

### Frontend không kết nối được Backend

- Kiểm tra Backend đang chạy: http://localhost:3000
- Verify CORS settings trong `backend/app.js`
- Check network tab trong browser DevTools

### Port conflicts

```powershell
# Kiểm tra port đang được sử dụng
netstat -ano | findstr :3000
netstat -ano | findstr :5173
netstat -ano | findstr :27016

# Kill process nếu cần
taskkill /PID <PID> /F
```

## License

Dự án học tập - CT574T Cơ sở dữ liệu nâng cao

---

_Nhóm 3 - CT574T - Thạc sĩ Khoa học máy tính 2025-2027_
