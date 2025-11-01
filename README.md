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

### 1. 🎯 **DEMO Production**: 4 máy Windows thực tế  
**Hướng dẫn**: `script/mongodb-cluster/production/windows-production-guide.md`

**Kiến trúc**: PC-1 (Web+Router+Neo4j), PC-2,3,4 (Shard+Config mỗi máy)  
**Mục đích**: Demo với high availability, failover thực tế

### 2. 💻 **DEV Local**: 1 máy + Docker containers (Hybrid)
**Quick Start**: `script/QUICK_START.md` | **Chi tiết**: `script/mongodb-cluster/docker/setup-docker.md`

**Kiến trúc**:
- **Native Windows**: Neo4j + Web App + MongoDB Router (mongos)
- **Docker containers**: 3 Shards + 3 Config Servers (giống Production)

**Mục đích**: Development **identical architecture** với Production, test high availability

### Truy cập các services:

**Native components (cả DEMO & DEV)**:
- **Web App**: http://localhost:3000  
- **MongoDB Router**: mongodb://localhost:27017/socialnetwork
- **Neo4j Browser**: http://localhost:7474 (neo4j/password123)

**DEV Docker components**:
- **Config Server 1**: localhost:27019
- **Config Server 2**: localhost:27119
- **Config Server 3**: localhost:27219  
- **Shard 1**: localhost:27018  
- **Shard 2**: localhost:27020
- **Shard 3**: localhost:27021

## Cấu trúc dự án

```
CT574T_Nhom3/
├── bin/
│   └── www                 # Entry point của ứng dụng
├── public/                 # Static files (CSS, images, JS)
│   └── stylesheets/
│       └── style.css
├── routes/                 # Route handlers
│   ├── index.js           # Route chính
│   └── users.js           # Route cho users
├── views/                  # Template files
│   ├── error.jade
│   ├── index.jade
│   └── layout.jade
├── script/                 # MongoDB + Neo4j setup scripts
│   ├── QUICK_START.md     # DEV environment quick start  
│   ├── mongodb-cluster/   # MongoDB Sharded Cluster setup
│   ├── neo4j/            # Neo4j native Windows setup
│   └── integration/      # MongoDB + Neo4j connection
├── app.js                  # Cấu hình Express app
├── package.json           # Dependencies và scripts
└── README.md              # Tài liệu dự án
```

## Scripts có sẵn

- `npm start` - Chạy ứng dụng (cần MongoDB và Neo4j sẵn sàng)
- `npm install` - Cài đặt dependencies

### Quick Setup Commands

**DEMO Production**: Xem `script/mongodb-cluster/production/windows-production-guide.md`

**DEV Local**: 
```bash
# 1. Start Docker containers
cd script/mongodb-cluster/docker
docker-compose up mongo-config1 mongo-config2 mongo-config3 mongo-shard1 mongo-shard2 mongo-shard3 -d

# 2. Initialize replica sets và start mongos native 
# (xem chi tiết trong script/QUICK_START.md)

# 3. Start web app
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