# Hướng dẫn Setup và Test Neo4j Connection

## 🚀 Tổng quan

Dự án đã được cấu hình để kết nối với Neo4j database theo 2 cách:
- **Neo4j Desktop (Local)** - Khuyến nghị cho development
- **Neo4j Aura (Cloud)** - Cho production

## 📋 Bước 1: Cài đặt Neo4j Desktop

Theo hướng dẫn trong `script/neo4j/windows-setup.md`:

1. Tải và cài Neo4j Desktop từ https://neo4j.com/download/
2. Tạo project mới: `CT574T_SocialNetwork`
3. Tạo database với thông tin:
   - **Name**: `socialnetwork`
   - **Password**: `password123`
   - **Version**: 5.15.0+

## 📋 Bước 2: Cấu hình Environment

File `.env` đã được thiết lập để sử dụng Neo4j Local:

```env
# Neo4j Local Configuration (Neo4j Desktop)
NEO4J_LOCAL=true
NEO4J_DATABASE=socialnetwork
```

**Lưu ý**: Nếu muốn sử dụng Neo4j Aura, uncomment các dòng NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD và comment dòng NEO4J_LOCAL.

## 📋 Bước 3: Khởi động Neo4j Desktop

1. Mở Neo4j Desktop
2. Start database `socialnetwork`
3. Đợi status chuyển thành **Active**

## 📋 Bước 4: Test Connection

Chạy script test kết nối:

```bash
npm run test-neo4j
```

Nếu thành công, bạn sẽ thấy:
```
✅ Neo4j: Connected to Neo4j!
✅ Neo4j constraints và indexes đã được tạo
🎉 Test kết nối Neo4j hoàn tất thành công!
```

## 📋 Bước 5: Khởi động Server

```bash
# Development mode
npm run dev

# Production mode  
npm start
```

Server sẽ chạy trên: http://localhost:3000

## 🧪 Test API Endpoints

Sau khi server chạy, test các endpoints Neo4j:

### 1. Test kết nối cơ bản
```bash
GET http://localhost:3000/api/neo4j/test
```

### 2. Tạo sample users
```bash
POST http://localhost:3000/api/neo4j/create-sample-users
```

### 3. Lấy danh sách users
```bash
GET http://localhost:3000/api/neo4j/users
```

### 4. Xem relationships của user
```bash
GET http://localhost:3000/api/neo4j/users/1/relationships
```

## 🔧 Troubleshooting

### Lỗi "Database does not exist"
**Nguyên nhân**: Neo4j Desktop chưa khởi động hoặc database name không đúng.

**Giải pháp**:
1. Mở Neo4j Desktop
2. Kiểm tra database `socialnetwork` đã được tạo chưa
3. Start database `socialnetwork`
4. Chạy lại test

### Lỗi "Connection refused" 
**Nguyên nhân**: Neo4j Desktop chưa được khởi động.

**Giải pháp**:
1. Khởi động Neo4j Desktop
2. Start database
3. Kiểm tra port 7687 không bị chiếm dụng

### Lỗi "Authentication failed"
**Nguyên nhân**: Username/password không đúng.

**Giải pháp**:
1. Trong Neo4j Desktop, reset password về `password123`
2. Hoặc cập nhật password trong `config/database.js`

## 📚 Files quan trọng

- `config/database.js` - Cấu hình kết nối databases
- `routes/neo4j-demo.js` - API endpoints để test Neo4j
- `test-neo4j.js` - Script test kết nối độc lập
- `.env` - Cấu hình environment variables

## 🎯 Next Steps

Sau khi setup thành công:

1. Khám phá Neo4j Browser tại http://localhost:7474
2. Chạy các sample queries trong `script/neo4j/sample-queries.cypher`
3. Phát triển thêm API endpoints cho ứng dụng của bạn
4. Tích hợp với MongoDB cho kiến trúc hybrid database

## 📖 Tài liệu tham khảo

- [Neo4j Desktop Guide](https://neo4j.com/docs/desktop-manual/)
- [Neo4j Driver for JavaScript](https://neo4j.com/docs/javascript-manual/current/)
- [Cypher Query Language](https://neo4j.com/docs/cypher-manual/current/)