# Neo4j Setup Guide

## Quick Setup (5 phút)

### Bước 1: Download & Install
1. Download Neo4j Desktop: https://neo4j.com/download/
2. Install file `.exe`
3. Start Neo4j Desktop

### Bước 2: Create Database
1. New Project → "Social Network"
2. Add Database → Create Local Database
3. **Name**: `socialnetwork`
4. **Password**: `password123`
5. **Start** database

### Bước 3: Test
1. Open Neo4j Browser (http://localhost:7474)
2. Login: neo4j / password123
3. Run test query:
```cypher
CREATE (u:User {name: "Test User"}) RETURN u
```

## Kết nối với Web App

Web app sẽ tự động kết nối với:
- **URL**: bolt://localhost:7687
- **User**: neo4j  
- **Password**: password123

## Sample Queries

```cypher
// Tạo users
CREATE (u1:User {user_id: 1, name: "John"})
CREATE (u2:User {user_id: 2, name: "Jane"})

// Tạo relationship
CREATE (u1)-[:FOLLOWS]->(u2)

// Query relationships  
MATCH (u1:User)-[:FOLLOWS]->(u2:User) RETURN u1, u2
```