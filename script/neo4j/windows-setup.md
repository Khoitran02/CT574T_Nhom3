# Neo4j Windows Native Setup

## Hướng dẫn cài đặt Neo4j trên Windows

### 1. Tải Neo4j Community Edition

1. Truy cập: https://neo4j.com/download/
2. Chọn **Neo4j Community Edition**
3. Tải về Neo4j Desktop hoặc Neo4j Community Server
4. **Khuyến nghị**: Tải Neo4j Desktop để quản lý dễ dàng

### 2. Cài đặt Neo4j Desktop

```powershell
# Chạy file .exe đã tải về
# Theo hướng dẫn installation wizard
```

#### 2.1 Tạo Project mới
1. Mở Neo4j Desktop
2. Click **New Project**
3. Đặt tên: `CT574T_SocialNetwork`

#### 2.2 Tạo Database mới
1. Trong project, click **Add Database**
2. Chọn **Local DBMS**
3. Cấu hình:
   - **Name**: `socialnetwork`
   - **Password**: `password123`
   - **Version**: 5.15.0 (latest)

### 3. Khởi động Database

1. Click **Start** trên database `socialnetwork`
2. Đợi status chuyển thành **Active**
3. Click **Open** để mở Neo4j Browser

### 4. Cấu hình cơ bản

#### 4.1 Truy cập Neo4j Browser
- URL: http://localhost:7474
- Username: `neo4j` 
- Password: `password123`

#### 4.2 Tạo constraints và indexes
```cypher
// Constraint cho User nodes
CREATE CONSTRAINT user_id_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

CREATE INDEX user_email_index IF NOT EXISTS
FOR (u:User) ON (u.email);

CREATE INDEX user_username_index IF NOT EXISTS  
FOR (u:User) ON (u.username);
```

#### 4.3 Tạo sample data
```cypher
// Tạo users
CREATE (u1:User {id: 1, username: 'john_doe', email: 'john@example.com', name: 'John Doe'})
CREATE (u2:User {id: 2, username: 'jane_smith', email: 'jane@example.com', name: 'Jane Smith'})
CREATE (u3:User {id: 3, username: 'bob_wilson', email: 'bob@example.com', name: 'Bob Wilson'})
CREATE (u4:User {id: 4, username: 'alice_johnson', email: 'alice@example.com', name: 'Alice Johnson'})
CREATE (u5:User {id: 5, username: 'charlie_brown', email: 'charlie@example.com', name: 'Charlie Brown'});

// Tạo relationships
MATCH (u1:User {id: 1}), (u2:User {id: 2})
CREATE (u1)-[:FOLLOWS {since: datetime()}]->(u2);

MATCH (u1:User {id: 1}), (u3:User {id: 3})
CREATE (u1)-[:FOLLOWS {since: datetime()}]->(u3);

MATCH (u2:User {id: 2}), (u1:User {id: 1})
CREATE (u2)-[:FOLLOWS {since: datetime()}]->(u1);

MATCH (u1:User {id: 1}), (u2:User {id: 2})
CREATE (u1)-[:FRIENDS {since: datetime()}]->(u2);
```

### 5. Kết nối từ Node.js

#### 5.1 Cài đặt Neo4j driver
```powershell
npm install neo4j-driver
```

#### 5.2 Cấu hình kết nối
```javascript
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'password123'),
  {
    maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
  }
);

// Test kết nối
async function testConnection() {
  const session = driver.session();
  try {
    const result = await session.run('RETURN "Connected to Neo4j!" AS message');
    console.log(result.records[0].get('message'));
  } catch (error) {
    console.error('Connection failed:', error);
  } finally {
    await session.close();
  }
}

testConnection();
```

### 6. Troubleshooting

#### 6.1 Port conflicts
```powershell
# Kiểm tra ports đang sử dụng
netstat -an | findstr 7474
netstat -an | findstr 7687

# Nếu conflict, thay đổi ports trong Neo4j Desktop:
# Settings > Configuration > dbms.connector.http.listen_address
# Settings > Configuration > dbms.connector.bolt.listen_address
```

#### 6.2 Memory settings (tùy chọn)
```
# Trong Neo4j Desktop > Settings > Configuration
dbms.memory.heap.initial_size=512m
dbms.memory.heap.max_size=1G
dbms.memory.pagecache.size=512m
```

#### 6.3 Khởi động lại service
```powershell
# Trong Neo4j Desktop:
# Stop database > Start database

# Hoặc restart Neo4j Desktop application
```

### 7. Monitoring và Maintenance

#### 7.1 Kiểm tra database info
```cypher
// Database version và info
CALL dbms.components() YIELD name, versions, edition
RETURN name, versions, edition;

// Memory usage
CALL dbms.queryJmx("org.neo4j:instance=kernel#0,name=Memory Pools");

// Database info
CALL db.info();
```

#### 7.2 Backup (thông qua Neo4j Desktop)
1. Stop database
2. Trong **Manage** tab, chọn **Dump**
3. Chọn location để save backup file

#### 7.3 Restore
1. Stop database  
2. Trong **Manage** tab, chọn **Load Dump**
3. Select backup file để restore

### 8. Security cho Production

#### 8.1 Thay đổi default password
```cypher
// Chạy khi lần đầu login
ALTER CURRENT USER SET PASSWORD FROM 'neo4j' TO 'your-strong-password';
```

#### 8.2 Cấu hình HTTPS (tùy chọn)
```
# Trong Configuration settings
dbms.connector.https.enabled=true
dbms.connector.https.listen_address=:7473
```

## Thông tin kết nối

- **Neo4j Browser**: http://localhost:7474
- **Bolt Protocol**: bolt://localhost:7687  
- **Username**: `neo4j`
- **Password**: `password123`

## Tài liệu tham khảo

- [Neo4j Desktop User Guide](https://neo4j.com/docs/desktop-manual/)
- [Neo4j Operations Manual](https://neo4j.com/docs/operations-manual/current/)
- [Cypher Manual](https://neo4j.com/docs/cypher-manual/current/)