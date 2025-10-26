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
- MongoDB Sharded Cluster chạy trên Docker containers
- Neo4j cài đặt native trên Windows  
- Web application chạy local

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
- Node.js (phiên bản 16.x trở lên)
- Docker Desktop (cho development)
- npm hoặc yarn

## 🚀 Hai mô hình triển khai

### 1. 🎯 **DEMO Production**: 4 máy Windows thực tế  
**Hướng dẫn**: `script/mongodb-cluster/production/windows-production-guide.md`

**Kiến trúc**: PC-1 (Web+Router+Neo4j), PC-2,3,4 (Shard+Config mỗi máy)  
**Mục đích**: Demo với high availability, failover thực tế

### 2. 💻 **DEV Local**: 1 máy + Docker containers  
**Quick Start**: `script/QUICK_START.md` | **Chi tiết**: `script/mongodb-cluster/docker/setup-docker.md`

**Kiến trúc**: Neo4j native + Web App local + MongoDB Docker containers  
**Mục đích**: Development khi không có sẵn 4 máy nhóm

### Truy cập các services:
- **Web App**: http://localhost:3000  
- **MongoDB**: mongodb://localhost:27017/socialnetwork
- **Neo4j**: http://localhost:7474 (neo4j/password123)
- **MongoDB Express**: http://localhost:8081 (admin/admin123)

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
├── script/                 # Scripts bổ sung
├── app.js                  # Cấu hình Express app
├── package.json           # Dependencies và scripts
└── README.md              # Tài liệu dự án
```

## Scripts có sẵn

- `npm start` - Chạy ứng dụng ở chế độ production

## Thành viên nhóm 3
- [Tên thành viên 1] - [MSSV] - [Email]
- [Tên thành viên 2] - [MSSV] - [Email]
- [Tên thành viên 3] - [MSSV] - [Email]

## Tính năng chính
- **Quản lý người dùng**: Đăng ký, đăng nhập, cập nhật thông tin
- **Quản lý bài viết**: Tạo, sửa, xóa, xem bài viết
- **Hệ thống bình luận**: Bình luận trên bài viết
- **Mối quan hệ người dùng**: Follow/Unfollow, kết bạn (lưu trong Neo4j)

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
- **User nodes**: Thông tin cơ bản người dùng
- **FOLLOWS relationship**: Mối quan hệ follow giữa users
- **FRIENDS relationship**: Mối quan hệ bạn bè

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