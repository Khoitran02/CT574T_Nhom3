# Testing Guide for Followers/Following and Stats

## Test Followers/Following APIs

### 1. Get Followers
```bash
# Get followers of a user
curl http://localhost:3000/api/relationships/followers/USER_ID_HERE

# With pagination
curl "http://localhost:3000/api/relationships/followers/USER_ID_HERE?page=1&limit=20"
```

### 2. Get Following
```bash
# Get following list of a user
curl http://localhost:3000/api/relationships/following/USER_ID_HERE

# With pagination
curl "http://localhost:3000/api/relationships/following/USER_ID_HERE?page=1&limit=20"
```

### 3. Get User Stats
```bash
# Get follower/following counts
curl http://localhost:3000/api/relationships/stats/USER_ID_HERE
```

## Expected Response Format

### Followers/Following Response
```json
{
  "message": "Lấy danh sách followers thành công",
  "data": [
    {
      "user": {
        "id": "userId",
        "username": "username",
        "email": "email@example.com",
        "name": "Full Name"
      },
      "since": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Stats Response
```json
{
  "message": "Lấy thống kê thành công",
  "data": {
    "followersCount": 50,
    "followingCount": 30
  }
}
```

## Common Issues

### Issue 1: Empty followers/following list
**Cause:** No relationships exist in Neo4j
**Solution:** 
1. Check Neo4j has user nodes: `MATCH (u:User) RETURN count(u)`
2. Check relationships: `MATCH ()-[r:FOLLOWS]->() RETURN count(r)`
3. Create test relationships via API or Neo4j browser

### Issue 2: Wrong user ID
**Cause:** Using MongoDB _id instead of Neo4j id
**Solution:** 
- Neo4j stores user with `id` property (string)
- This should match MongoDB `_id.toString()`
- Frontend should pass `user._id` as userId parameter

### Issue 3: Stats show 0 when relationships exist
**Cause:** Query using wrong userId format
**Solution:** Ensure userId is string, not ObjectId

## Frontend Debugging

### Check API calls in DevTools Network tab:
```
Request URL: http://localhost:5173/api/relationships/followers/67389...
Request Method: GET
Status Code: 200 OK
```

### Check Response Data:
```javascript
// In browser console
fetch('http://localhost:3000/api/relationships/followers/YOUR_USER_ID')
  .then(r => r.json())
  .then(console.log)
```

## Test Sequence

1. **Create Follow Relationship**
```bash
curl -X POST http://localhost:3000/api/relationships/follow \
  -H "Content-Type: application/json" \
  -d '{"followerId": "USER1_ID", "followeeId": "USER2_ID"}'
```

2. **Verify Followers**
```bash
curl http://localhost:3000/api/relationships/followers/USER2_ID
# Should show USER1 in the list
```

3. **Verify Following**
```bash
curl http://localhost:3000/api/relationships/following/USER1_ID
# Should show USER2 in the list
```

4. **Check Stats**
```bash
# USER1 stats
curl http://localhost:3000/api/relationships/stats/USER1_ID
# followingCount should be 1

# USER2 stats  
curl http://localhost:3000/api/relationships/stats/USER2_ID
# followersCount should be 1
```

## Quick Fix Commands

### Reset Neo4j Relationships (if corrupted)
```cypher
// In Neo4j Browser
MATCH ()-[r:FOLLOWS]->() DELETE r;
```

### Verify User Sync Between MongoDB and Neo4j
```bash
# Get users from MongoDB
curl http://localhost:3000/api/users | jq '.data | length'

# Get users from Neo4j (via API)
# Should match MongoDB count
```

### Re-sync Users to Neo4j (if needed)
Run the seed script or manually sync users through the API.

