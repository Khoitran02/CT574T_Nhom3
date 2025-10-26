# Hướng dẫn cấu hình MongoDB Sharded Cluster + Neo4j

## Tổng quan
Thư mục này chứa các hướng dẫn và scripts để cấu hình MongoDB Sharded Cluster kết hợp với Neo4j cho dự án mạng xã hội mini.

## Cấu trúc thư mục
```
script/
├── README.md                           # Tài liệu này
├── QUICK_START.md                      # Hướng dẫn khởi động nhanh cho Dev
├── mongodb-cluster/                    # Cấu hình MongoDB Sharded Cluster
│   ├── production/                     # DEMO: 4 máy Windows thực tế
│   │   └── windows-production-guide.md # Setup 4 máy: Web+Router + 3 Shard+Config
│   └── docker/                         # DEV: 1 máy local + Docker
│       ├── docker-compose.yml         # Docker compose cho shards
│       ├── setup-docker.md            # Setup local development
│       └── init-scripts/              # Scripts khởi tạo tự động
├── neo4j/                             # Cấu hình Neo4j (native Windows)
│   ├── windows-setup.md              # Cài đặt Neo4j Desktop/Community
│   └── sample-queries.cypher         # Các truy vấn mẫu cho social network
└── integration/                       # Tích hợp MongoDB + Neo4j
    └── connection-config.md          # Cấu hình kết nối Node.js
```

## Hai mô hình triển khai

### 1. 🎯 DEMO: 4 máy Windows thực tế (Production-ready)
**File**: `mongodb-cluster/production/windows-production-guide.md`

**Kiến trúc**:
- **PC-1**: Web App + mongos Router + Neo4j
- **PC-2**: MongoDB Shard 1 + Config Server 1  
- **PC-3**: MongoDB Shard 2 + Config Server 2
- **PC-4**: MongoDB Shard 3 + Config Server 3

**Mục đích**: Demo MongoDB Sharded Cluster thực tế với high availability, failover capability

### 2. 💻 DEV: 1 máy local + Docker (Development)
**File**: `mongodb-cluster/docker/setup-docker.md`  
**Quick Start**: `QUICK_START.md`

**Kiến trúc**:
- **Native trên Windows**: Neo4j + Web App + MongoDB Router (mongos) + Mongo Express
- **Docker containers**: 3 containers (mỗi container: 1 Shard + 1 Config Server)
  - Container 1: Shard 1 + Config Server 1
  - Container 2: Shard 2 + Config Server 2  
  - Container 3: Shard 3 + Config Server 3

**Mục đích**: Development gần giống production, dễ debug và monitor

## Yêu cầu hệ thống

### DEMO (4 máy Windows LAN)
- **PC-1**: Web App + mongos Router + Neo4j  
  - RAM: 4GB+, CPU: 2 cores+, Disk: 100GB+
- **PC-2,3,4**: MongoDB Shard + Config Server (mỗi máy)
  - RAM: 4GB+, CPU: 2 cores+, Disk: 200GB+

### DEV (1 máy + Docker)  
- **Local máy**: Neo4j native + Web App + Docker Desktop
- RAM: 8GB+, CPU: 4 cores+, Disk: 20GB+

## Ports sử dụng
- **MongoDB Config Server**: 27019
- **MongoDB Shards**: 27018, 27020, 27021
- **MongoDB Router (mongos)**: 27017
- **Neo4j**: 7474 (HTTP), 7687 (Bolt)
- **Web Application**: 3000

## Tài liệu tham khảo
- [MongoDB Sharding Documentation](https://docs.mongodb.com/manual/sharding/)
- [Neo4j Operations Manual](https://neo4j.com/docs/operations-manual/current/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)