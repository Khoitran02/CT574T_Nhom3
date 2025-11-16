# Hướng Dẫn Sử Dụng Social Network Mini

## Tổng Quan Thay Đổi

Dự án đã được chuyển đổi thành một mạng xã hội mini với phân quyền Admin/User và tích hợp MongoDB + Neo4j.

## Cài Đặt

### 1. Cài đặt dependencies

```bash
# Backend
cd backend
npm install

# Frontend  
cd frontend
npm install
```

### 2. Tạo Admin User

Sau khi khởi động backend, gọi API để tạo admin user mặc định:

```bash
curl -X POST http://localhost:3001/api/seed/admin
```

**Thông tin đăng nhập Admin:**
- Username: `admin`
- Password: `admin123`

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

## Tính Năng

### User Features
1. **Đăng ký tài khoản** - Tự động tạo node trong Neo4j
2. **Đăng nhập** - Phân quyền theo role
3. **Đăng bài viết** - Lưu vào MongoDB, tạo relationship trong Neo4j
4. **Follow users** - Relationship FOLLOWS trong Neo4j (1 chiều)
5. **Xem followers/following** - Query từ Neo4j
6. **News Feed** - Hiển thị bài viết của tất cả users

### Admin Features
1. **Quản lý users** - CRUD operations
2. **Quản lý posts** - CRUD operations
3. **Xem social network graph** - Visualize relationships
4. **Monitor database status** - MongoDB + Neo4j health check

## Database Schema

### MongoDB - User Collection
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  name: String,
  bio: String,
  avatar: String,
  role: "user" | "admin",
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Neo4j - User Node
```cypher
(:User {
  id: String (MongoDB _id),
  username: String,
  email: String,
  name: String,
  created: DateTime
})
```

### Neo4j - Follow Relationship
```cypher
(:User)-[:FOLLOWS {since: DateTime}]->(:User)
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Đăng ký user mới
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Users
- `GET /api/users` - Lấy danh sách users
- `POST /api/users` - Tạo user mới
- `PUT /api/users/:id` - Cập nhật user
- `DELETE /api/users/:id` - Xóa user (soft delete)

### Posts
- `GET /api/posts` - Lấy danh sách posts
- `POST /api/posts` - Tạo post mới
- `PUT /api/posts/:id` - Cập nhật post
- `DELETE /api/posts/:id` - Xóa post

### Relationships (Neo4j)
- `POST /api/relationships/follow` - Follow user
- `POST /api/relationships/unfollow` - Unfollow user
- `GET /api/relationships/followers/:userId` - Lấy followers
- `GET /api/relationships/following/:userId` - Lấy following
- `GET /api/relationships/stats/:userId` - Thống kê follow

### Seed
- `POST /api/seed/admin` - Tạo admin user mặc định

## Lưu Ý Quan Trọng

1. **Password Security**: Passwords được hash bằng bcrypt với salt rounds = 10

2. **Neo4j for Users Only**: Chỉ user role được tạo node trong Neo4j, admin không cần vì không tham gia social network

3. **Follow là 1 chiều**: User A follow User B không tự động tạo follow ngược lại

4. **Session Management**: Hiện tại sử dụng localStorage, trong production nên dùng JWT

5. **Form Labels**: Tất cả modal forms đã được chuẩn hóa với label text-left

## Khởi Động Dự Án

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

Truy cập:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Workflow Thông Thường

1. Tạo admin user: `POST /api/seed/admin`
2. Truy cập `/login` và đăng nhập bằng admin
3. Tại Admin Panel, tạo một vài test users
4. Đăng xuất và đăng ký tài khoản user mới
5. Đăng bài viết, follow users khác
6. Quay lại admin panel để xem toàn bộ hệ thống
