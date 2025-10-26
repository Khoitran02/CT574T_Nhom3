#!/bin/bash
# init-shards.sh - Script tự động khởi tạo MongoDB Sharded Cluster

echo "=== Bắt đầu cấu hình MongoDB Sharded Cluster ==="

# Chờ các MongoDB instances khởi động
echo "Đang chờ MongoDB instances khởi động..."
sleep 30

# Khởi tạo Config Server Replica Set
echo "=== Cấu hình Config Server Replica Set ==="
docker exec mongo-config mongosh --port 27019 --eval '
rs.initiate({
  _id: "configrs",
  configsvr: true,
  members: [
    { _id: 0, host: "mongo-config:27019" }
  ]
})
'

# Chờ config server sẵn sàng
echo "Chờ Config Server sẵn sàng..."
sleep 10

# Khởi tạo Shard 1 Replica Set
echo "=== Cấu hình Shard 1 Replica Set ==="
docker exec mongo-shard1 mongosh --port 27018 --eval '
rs.initiate({
  _id: "shard1rs",
  members: [
    { _id: 0, host: "mongo-shard1:27018" }
  ]
})
'

# Khởi tạo Shard 2 Replica Set  
echo "=== Cấu hình Shard 2 Replica Set ==="
docker exec mongo-shard2 mongosh --port 27020 --eval '
rs.initiate({
  _id: "shard2rs",
  members: [
    { _id: 0, host: "mongo-shard2:27020" }
  ]
})
'

# Khởi tạo Shard 3 Replica Set
echo "=== Cấu hình Shard 3 Replica Set ==="
docker exec mongo-shard3 mongosh --port 27021 --eval '
rs.initiate({
  _id: "shard3rs", 
  members: [
    { _id: 0, host: "mongo-shard3:27021" }
  ]
})
'

# Chờ các shard sẵn sàng
echo "Chờ các Shards sẵn sàng..."
sleep 15

# Cấu hình Sharded Cluster
echo "=== Cấu hình Sharded Cluster ==="
docker exec mongo-router mongosh --port 27017 --eval '
// Thêm các shards vào cluster
sh.addShard("shard1rs/mongo-shard1:27018");
sh.addShard("shard2rs/mongo-shard2:27020"); 
sh.addShard("shard3rs/mongo-shard3:27021");

// Hiển thị trạng thái cluster
sh.status();
'

# Tạo database và enable sharding
echo "=== Tạo database và enable sharding ==="
docker exec mongo-router mongosh --port 27017 --eval '
use socialnetwork;

// Enable sharding cho database
sh.enableSharding("socialnetwork");

// Tạo và shard các collections
db.createCollection("users");
sh.shardCollection("socialnetwork.users", {"user_id": 1});

db.createCollection("posts");
sh.shardCollection("socialnetwork.posts", {"user_id": 1});

db.createCollection("comments");
sh.shardCollection("socialnetwork.comments", {"post_id": 1});

// Hiển thị kết quả
sh.status();
'

echo "=== Hoàn thành cấu hình MongoDB Sharded Cluster ==="
echo ""
echo "Thông tin kết nối:"
echo "- MongoDB Router: mongodb://localhost:27017/socialnetwork"
echo "- Mongo Express: http://localhost:8081 (admin/admin123)"
echo "- Neo4j: Install native trên Windows (xem script/neo4j/)"
echo ""
echo "Chạy script test-data.sh để thêm dữ liệu mẫu"