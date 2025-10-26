#!/bin/bash
# test-data.sh - Script thêm dữ liệu mẫu để test sharded cluster

echo "=== Thêm dữ liệu mẫu vào MongoDB Sharded Cluster ==="

docker exec mongo-router mongosh --port 27017 --eval '
use socialnetwork;

// Thêm dữ liệu users
print("Thêm dữ liệu users...");
db.users.insertMany([
  {user_id: 1, username: "john_doe", email: "john@example.com", full_name: "John Doe", created_at: new Date()},
  {user_id: 2, username: "jane_smith", email: "jane@example.com", full_name: "Jane Smith", created_at: new Date()},
  {user_id: 3, username: "bob_wilson", email: "bob@example.com", full_name: "Bob Wilson", created_at: new Date()},
  {user_id: 4, username: "alice_johnson", email: "alice@example.com", full_name: "Alice Johnson", created_at: new Date()},
  {user_id: 5, username: "charlie_brown", email: "charlie@example.com", full_name: "Charlie Brown", created_at: new Date()},
  {user_id: 6, username: "diana_prince", email: "diana@example.com", full_name: "Diana Prince", created_at: new Date()},
  {user_id: 7, username: "edward_norton", email: "edward@example.com", full_name: "Edward Norton", created_at: new Date()},
  {user_id: 8, username: "fiona_apple", email: "fiona@example.com", full_name: "Fiona Apple", created_at: new Date()},
  {user_id: 9, username: "george_martin", email: "george@example.com", full_name: "George Martin", created_at: new Date()},
  {user_id: 10, username: "helen_troy", email: "helen@example.com", full_name: "Helen Troy", created_at: new Date()}
]);

// Thêm dữ liệu posts
print("Thêm dữ liệu posts...");
db.posts.insertMany([
  {post_id: 1, user_id: 1, content: "Hello world! This is my first post on this social network.", likes: 5, created_at: new Date()},
  {post_id: 2, user_id: 2, content: "Beautiful sunset today! 🌅", likes: 12, created_at: new Date()},
  {post_id: 3, user_id: 3, content: "Just finished reading a great book. Highly recommended!", likes: 8, created_at: new Date()},
  {post_id: 4, user_id: 1, content: "Working on a new project. Excited to share updates soon!", likes: 3, created_at: new Date()},
  {post_id: 5, user_id: 4, content: "Coffee and coding - perfect combination ☕💻", likes: 15, created_at: new Date()},
  {post_id: 6, user_id: 5, content: "Weekend hiking trip was amazing! Nature is the best therapy.", likes: 20, created_at: new Date()},
  {post_id: 7, user_id: 2, content: "Trying out new recipe today. Fingers crossed! 🍳", likes: 7, created_at: new Date()},
  {post_id: 8, user_id: 6, content: "Tech conference was incredible. So many inspiring talks!", likes: 11, created_at: new Date()},
  {post_id: 9, user_id: 3, content: "Movie night with friends. Nothing beats good company! 🎬", likes: 9, created_at: new Date()},
  {post_id: 10, user_id: 7, content: "Starting a new fitness journey. Day 1 complete! 💪", likes: 6, created_at: new Date()}
]);

// Thêm dữ liệu comments
print("Thêm dữ liệu comments...");
db.comments.insertMany([
  {comment_id: 1, post_id: 1, user_id: 2, content: "Welcome to the network!", created_at: new Date()},
  {comment_id: 2, post_id: 1, user_id: 3, content: "Great to have you here!", created_at: new Date()},
  {comment_id: 3, post_id: 2, user_id: 1, content: "Amazing photo! Where was this taken?", created_at: new Date()},
  {comment_id: 4, post_id: 2, user_id: 4, content: "Absolutely gorgeous! 😍", created_at: new Date()},
  {comment_id: 5, post_id: 3, user_id: 5, content: "What book was it? I need reading recommendations!", created_at: new Date()},
  {comment_id: 6, post_id: 4, user_id: 6, content: "Looking forward to seeing your project!", created_at: new Date()},
  {comment_id: 7, post_id: 5, user_id: 7, content: "Same! Cannot code without coffee ☕", created_at: new Date()},
  {comment_id: 8, post_id: 5, user_id: 8, content: "Which editor do you use?", created_at: new Date()},
  {comment_id: 9, post_id: 6, user_id: 9, content: "Hiking is the best! Which trail did you take?", created_at: new Date()},
  {comment_id: 10, post_id: 7, user_id: 10, content: "Hope it turns out delicious! 😋", created_at: new Date()}
]);

// Kiểm tra dữ liệu đã được phân tán
print("\\n=== Kiểm tra phân tán dữ liệu ===");
print("\\nUsers distribution:");
db.users.getShardDistribution();

print("\\nPosts distribution:");
db.posts.getShardDistribution();

print("\\nComments distribution:");  
db.comments.getShardDistribution();

// Thống kê cơ bản
print("\\n=== Thống kê dữ liệu ===");
print("Tổng số users: " + db.users.countDocuments());
print("Tổng số posts: " + db.posts.countDocuments());
print("Tổng số comments: " + db.comments.countDocuments());

// Test một số queries
print("\\n=== Test queries ===");
print("\\nPosts của user_id=1:");
db.posts.find({user_id: 1}).forEach(printjson);

print("\\nComments của post_id=1:");
db.comments.find({post_id: 1}).forEach(printjson);

print("\\nTop 3 posts có nhiều likes nhất:");
db.posts.find().sort({likes: -1}).limit(3).forEach(printjson);
'

echo ""
echo "=== Hoàn thành thêm dữ liệu mẫu ==="
echo ""
echo "Có thể test các queries sau:"
echo "1. Xem phân tán dữ liệu: db.users.getShardDistribution()"
echo "2. Tìm posts của user: db.posts.find({user_id: 1})"
echo "3. Tìm comments của post: db.comments.find({post_id: 1})"  
echo "4. Top posts: db.posts.find().sort({likes: -1}).limit(5)"