# CT574T - Nhóm 3
## MongoDB Sharded Cluster + Neo4j – Mạng xã hội mini

## Mô tả dự án
Dự án nghiên cứu và triển khai mô hình cơ sở dữ liệu phân tán kết hợp MongoDB Sharded Cluster và Neo4j cho ứng dụng mạng xã hội mini. Dự án tập trung chính vào việc cấu hình và quản lý hệ thống cơ sở dữ liệu phân tán, với giao diện web đơn giản để kiểm thử các chức năng CRUD cơ bản.

## Kiến trúc hệ thống
- **MongoDB Sharded Cluster**: Lưu trữ dữ liệu người dùng, bài viết, bình luận
- **Neo4j**: Quản lý mối quan hệ giữa người dùng (follow, friend)
- **Node.js Express**: Ứng dụng web API và giao diện

## Mô hình triển khai
### Production Environment (4 máy qua LAN)
- **Máy 1**: Web Application (Node.js) + MongoDB Router (mongos) + Neo4j
- **Máy 2-4**: MongoDB Sharded Cluster (3 shards)

### Development Environment (Hybrid Local)
- **Native Windows**: Neo4j + Web App + MongoDB Router (mongos) + Mongo Express
- **Docker containers**: 3 Shards + 3 Config Servers (mỗi container: 1 Shard + 1 Config)

## Công nghệ sử dụng
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web framework cho Node.js
- **MongoDB** - Document database với Sharded Cluster
- **Neo4j** - Graph database cho mối quan hệ
- **Docker** - Containerization cho môi trường development
- **Jade** - Template engine
- **Morgan** - HTTP request logger middleware
- **Cookie Parser** - Middleware để parse cookies

## Cài đặt và chạy dự án

### Yêu cầu hệ thống

**DEMO Production (4 máy Windows)**:
- MongoDB Community Server 7.0+
- Node.js 18.x+  
- Neo4j Desktop/Community 5.15+
- Windows 10/11, RAM 4GB+

**DEV Local (1 máy hybrid)**:
- MongoDB Community Server 7.0+ (cho mongos)
- Node.js 18.x+
- Neo4j Desktop 5.15+
- Docker Desktop
- Windows 10/11, RAM 8GB+

## 🚀 Hai mô hình triển khai

### 1. **Development** (Docker containers trên 1 máy)
- 📋 **Mục đích**: Development, Testing, Demo, Learning
- 🔧 **Yêu cầu**: Docker Desktop + Neo4j Desktop  
- ⏱️ **Setup time**: 5 phút (tự động)
- 💾 **Tài nguyên**: ~2-3 GB RAM
- 📖 **Hướng dẫn**: [docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md)

### 2. **Production** (4 máy Windows thực tế)
- 📋 **Mục đích**: Production environment, High availability
- � **Yêu cầu**: 4 máy Windows trong cùng LAN
- ⏱️ **Setup time**: 30-45 phút  
- 💾 **Tài nguyên**: Phân tán trên 4 máy
- 📖 **Hướng dẫn**: [docs/PRODUCTION_SETUP.md](docs/PRODUCTION_SETUP.md)

---

## ⚡ Quick Start

### Development (1 máy - Hybrid)
```cmd
# Clone project
git clone [repo-url]
cd CT574T_Nhom3

# Start containers và cấu hình từng bước (10 phút)
docker-compose up -d
# Theo hướng dẫn chi tiết trong docs/DEVELOPMENT_SETUP.md

# Setup Neo4j và start web app
npm install
npm start
```

### Production (4 máy LAN)
```cmd
# Setup MongoDB trên tất cả 4 máy
# Cấu hình từng bước thủ công (30 phút)
# Theo hướng dẫn chi tiết trong docs/PRODUCTION_SETUP.md

# Kết quả: Cluster production-ready
```

**Chi tiết**: [QUICK_START.md](QUICK_START.md)

### Truy cập các services:

**Native components (cả DEMO & DEV)**:
- **Web App**: http://localhost:3000  
- **MongoDB Router**: mongodb://localhost:27017/socialnetwork
- **Neo4j Browser**: http://localhost:7474 (neo4j/password123)

**DEV Docker components**:
- **Config Server 1**: localhost:27019
- **Config Server 2**: localhost:27020
- **Config Server 3**: localhost:27021  
- **Shard 1**: localhost:27022  
- **Shard 2**: localhost:27023
- **Shard 3**: localhost:27024

## Cấu trúc dự án

```
CT574T_Nhom3/
├── bin/
│   └── www                    # Entry point của ứng dụng
├── public/                    # Static files (CSS, images, JS)
├── routes/                    # Route handlers
├── views/                     # Template files (Jade)
├── docs/                      # Tài liệu setup
│   ├── DEVELOPMENT_SETUP.md   # Setup development (Docker + Native)
│   └── PRODUCTION_SETUP.md    # Setup production (4 máy LAN)
├── script/                    # Utility scripts
│   ├── mongosh.ps1/.bat      # MongoDB shell wrapper
│   ├── neo4j/               # Neo4j setup guides
│   └── production/          # Production documentation
├── docker-compose.yml        # Docker containers definition
├── app.js                   # Express app configuration
├── package.json            # Dependencies
├── QUICK_START.md          # Quick start guide
└── README.md              # Tài liệu chính
```

## Scripts có sẵn

- `npm start` - Chạy ứng dụng (cần MongoDB và Neo4j sẵn sàng)
- `npm install` - Cài đặt dependencies

### Quick Setup Commands

**DEMO Production**: Xem `docs/PRODUCTION_SETUP.md`

**DEV Local**: 
```cmd
# Manual setup (step-by-step control):
docker-compose up -d
# Follow detailed steps in docs/DEVELOPMENT_SETUP.md
# Setup replica sets, sharding, Neo4j
npm install
npm start
```

## Thành viên nhóm 4
- [Tên thành viên 1] - [MSHV] - [Email]
- [Tên thành viên 2] - [MSHV] - [Email]
- [Tên thành viên 3] - [MSHV] - [Email]
- [Tên thành viên 4] - [MSHV] - [Email]

## Điểm đặc biệt của kiến trúc

### MongoDB Sharded Cluster với 3 Config Servers
- ✅ **High Availability**: Chịu được 1 Config Server down
- ✅ **No Single Point of Failure**: Cluster vẫn hoạt động 
- ✅ **Production Ready**: Tuân thủ MongoDB best practices
- ✅ **Failover Demo**: Có thể demo khả năng chịu lỗi

### DEV Environment Hybrid Design
- ✅ **Gần giống Production**: mongos và Web App native như production
- ✅ **Dễ debug**: Có thể debug mongos và web app trực tiếp  
- ✅ **Performance tốt**: Native components nhanh hơn Docker
- ✅ **Flexible**: Restart từng component riêng biệt

## Tính năng chính
- **Quản lý người dùng**: Đăng ký, đăng nhập, cập nhật thông tin
- **Quản lý bài viết**: Tạo, sửa, xóa, xem bài viết (MongoDB Sharding)
- **Hệ thống bình luận**: Bình luận trên bài viết (MongoDB Sharding)
- **Mối quan hệ người dùng**: Follow/Unfollow, kết bạn (Neo4j Graph DB)

## API Endpoints
```
# Users
GET /users              - Danh sách users
POST /users             - Tạo user mới
PUT /users/:id          - Cập nhật user
DELETE /users/:id       - Xóa user

# Posts
GET /posts              - Danh sách bài viết
POST /posts             - Tạo bài viết mới
PUT /posts/:id          - Cập nhật bài viết
DELETE /posts/:id       - Xóa bài viết

# Comments
GET /posts/:id/comments - Bình luận của bài viết
POST /posts/:id/comments - Tạo bình luận mới

# Relationships (Neo4j)
POST /users/:id/follow  - Follow user
DELETE /users/:id/follow - Unfollow user
GET /users/:id/followers - Danh sách followers
```

## Database Schema

### MongoDB Collections
- **users**: Thông tin người dùng
- **posts**: Bài viết của người dùng  
- **comments**: Bình luận trên bài viết

### Neo4j Nodes & Relationships  
- **User nodes**: Thông tin cơ bản người dùng (đồng bộ từ MongoDB)
- **FOLLOWS relationship**: Mối quan hệ follow giữa users
- **FRIENDS relationship**: Mối quan hệ bạn bè

### Data Distribution Strategy
- **MongoDB Sharding Keys**:
  - `users` collection: Shard theo `user_id` 
  - `posts` collection: Shard theo `user_id`
  - `comments` collection: Shard theo `post_id`
- **Neo4j**: Tất cả relationships trong 1 graph database

## Đóng góp
1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## License
Dự án này được phát triển cho mục đích học tập trong môn CT574T.

## Liên hệ
- Email: [email liên hệ]
- GitHub: [link GitHub của nhóm]

---
*Dự án được phát triển bởi Nhóm 3 - CT574T Cơ sở dữ liệu nâng cao*