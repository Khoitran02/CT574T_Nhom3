/**
 * Large Dataset Seeder
 * Import 5000 users với mỗi user có 2000 posts
 * Total: 5000 users + 10,000,000 posts
 */

import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectMongoDB } from '../config/database.js';
import { connectNeo4j, getNeo4jSession } from '../config/database.js';
import User from '../models/users.model.js';
import Post from '../models/posts.model.js';
import Comment from '../models/comments.model.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load sample images list
const imagesListPath = path.join(__dirname, 'sample-images-list.json');
const SAMPLE_IMAGES = fs.existsSync(imagesListPath) 
  ? JSON.parse(fs.readFileSync(imagesListPath, 'utf-8'))
  : [];

// Configuration
const CONFIG = {
  TOTAL_USERS: 500,
  POSTS_PER_USER: 100,
  USER_BATCH_SIZE: 100,    // Insert 100 users at a time
  POST_BATCH_SIZE: 100,   // Insert 100 posts at a time
  NEO4J_BATCH_SIZE: 400,   // Insert 400 relationships at a time
};

// Sample data generators
const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emma', 'Chris', 'Lisa', 'Tom', 'Anna', 
  'James', 'Mary', 'Robert', 'Linda', 'Michael', 'Barbara', 'William', 'Susan', 'Richard', 'Jessica',
  'Joseph', 'Karen', 'Thomas', 'Nancy', 'Charles', 'Betty', 'Daniel', 'Helen', 'Matthew', 'Sandra'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Hernandez',
  'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee',
  'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker'];

const topics = ['Technology', 'Science', 'Travel', 'Food', 'Sports', 'Music', 'Art', 'Books', 'Movies', 'Gaming',
  'Fashion', 'Health', 'Business', 'Education', 'Photography', 'Nature', 'Fitness', 'Politics', 'History', 'Culture'];

const postTemplates = [
  "Just finished working on {topic}. Amazing experience!",
  "Excited about the latest developments in {topic}.",
  "My thoughts on {topic} - what do you think?",
  "Great day exploring {topic} today!",
  "{topic} is really changing the game right now.",
  "Can't stop thinking about {topic} lately.",
  "Sharing my journey with {topic}.",
  "The future of {topic} looks incredibly promising!",
  "Learning so much about {topic} every day.",
  "Here's what I discovered about {topic}...",
  "Breaking: New insights into {topic}!",
  "Why {topic} matters more than ever.",
  "My experience with {topic} has been transformative.",
  "Exploring the intersection of {topic} and innovation.",
  "5 things I learned about {topic} today.",
];

const commentTemplates = [
  "Great post! I completely agree with your perspective.",
  "This is really interesting. Can you share more details?",
  "Thanks for sharing this valuable insight!",
  "I have a different view on this topic...",
  "Excellent points made here!",
  "This reminds me of a similar experience I had.",
  "Very informative, learned something new today!",
  "Could you elaborate more on this?",
  "Totally resonates with me!",
  "Interesting take on {topic}!",
];

// Helper functions
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateUsername(firstName, lastName, index) {
  return `${firstName.toLowerCase()}_${lastName.toLowerCase()}${index}`;
}

function generateEmail(username) {
  return `${username}@example.com`;
}

function generateBio(topic) {
  return `Passionate about ${topic}. Sharing my journey and experiences with the world. 🚀`;
}

function generatePostContent(template, topic) {
  return template.replace('{topic}', topic);
}

function getRandomVisibility() {
  const rand = Math.random();
  if (rand < 0.10) return 'private';      // 10% private
  if (rand < 0.30) return 'followers';   // 20% followers (0.10 + 0.20)
  return 'public';                        // 70% public
}

// Progress tracking
class ProgressTracker {
  constructor(total, label) {
    this.total = total;
    this.current = 0;
    this.label = label;
    this.startTime = Date.now();
  }

  update(increment = 1) {
    this.current += increment;
    const percentage = ((this.current / this.total) * 100).toFixed(2);
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const remaining = this.current > 0 
      ? (((this.total - this.current) / this.current) * elapsed).toFixed(1)
      : '?';
    
    process.stdout.write(`\r${this.label}: ${this.current}/${this.total} (${percentage}%) - Elapsed: ${elapsed}s - Remaining: ~${remaining}s`);
    
    if (this.current >= this.total) {
      console.log('\n');
    }
  }
}

// Main seeding functions
async function generateUsers() {
  console.log('\n🔄 Generating users...');
  const users = [];
  const hashedPassword = await bcrypt.hash('123456@aB', 10);

  for (let i = 0; i < CONFIG.TOTAL_USERS; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const username = generateUsername(firstName, lastName, i);
    const topic = randomElement(topics);

    users.push({
      username,
      email: generateEmail(username),
      password: hashedPassword,
      name: `${firstName} ${lastName}`,
      bio: generateBio(topic),
      avatar: `https://i.pravatar.cc/150?u=${username}`,
      role: 'user',
      isActive: true,
    });
  }

  return users;
}

async function insertUsersBatch(users) {
  console.log('\n💾 Inserting users into MongoDB...');
  const progress = new ProgressTracker(CONFIG.TOTAL_USERS, 'Users inserted');
  const insertedUsers = [];

  for (let i = 0; i < users.length; i += CONFIG.USER_BATCH_SIZE) {
    const batch = users.slice(i, i + CONFIG.USER_BATCH_SIZE);
    
    try {
      const result = await User.insertMany(batch, { ordered: false });
      insertedUsers.push(...result);
      progress.update(batch.length);
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error - skip and continue
        console.warn(`\nWarning: Some users already exist, skipping...`);
        progress.update(batch.length);
      } else {
        throw error;
      }
    }
  }

  return insertedUsers;
}

async function insertUsersToNeo4j(users) {
  console.log('\n🔗 Inserting users into Neo4j...');
  const progress = new ProgressTracker(users.length, 'Neo4j users');
  const session = getNeo4jSession();

  try {
    for (let i = 0; i < users.length; i += CONFIG.NEO4J_BATCH_SIZE) {
      const batch = users.slice(i, i + CONFIG.NEO4J_BATCH_SIZE);
      
      const query = `
        UNWIND $users as user
        MERGE (u:User {id: user.id})
        SET u.username = user.username,
            u.email = user.email,
            u.name = user.name,
            u.role = user.role
      `;

      const userParams = batch.map(user => ({
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
      }));

      await session.run(query, { users: userParams });
      progress.update(batch.length);
    }
  } finally {
    await session.close();
  }
}

async function generateAndInsertPosts(users) {
  console.log('\n📝 Generating and inserting posts (50% with images)...');
  const totalPosts = CONFIG.TOTAL_USERS * CONFIG.POSTS_PER_USER;
  const progress = new ProgressTracker(totalPosts, 'Posts inserted');
  let postsWithImages = 0;

  for (let userIndex = 0; userIndex < users.length; userIndex++) {
    const user = users[userIndex];
    const userTopic = randomElement(topics);
    
    // Generate posts for this user in batches
    for (let postBatch = 0; postBatch < CONFIG.POSTS_PER_USER; postBatch += CONFIG.POST_BATCH_SIZE) {
      const batchSize = Math.min(CONFIG.POST_BATCH_SIZE, CONFIG.POSTS_PER_USER - postBatch);
      const posts = [];

      for (let i = 0; i < batchSize; i++) {
        const template = randomElement(postTemplates);
        const topic = Math.random() > 0.3 ? userTopic : randomElement(topics);
        const content = generatePostContent(template, topic);
        
        // Generate realistic likes
        const likesCount = Math.floor(Math.random() * 100);
        const likedBy = [];
        
        // Randomly select users who liked this post
        if (likesCount > 0 && users.length > 0) {
          const maxLikers = Math.min(likesCount, users.length);
          const selectedLikers = new Set();
          
          while (selectedLikers.size < maxLikers) {
            const randomUser = randomElement(users);
            selectedLikers.add(randomUser._id.toString());
          }
          
          likedBy.push(...Array.from(selectedLikers).map(id => id));
        }
        
        // 50% chance to have images
        const hasImages = Math.random() < 0.5;
        const images = hasImages && SAMPLE_IMAGES.length > 0
          ? [
              randomElement(SAMPLE_IMAGES),
              ...(Math.random() < 0.3 ? [randomElement(SAMPLE_IMAGES)] : []) // 30% chance for 2 images
            ]
          : [];
        
        if (images.length > 0) postsWithImages++;

        posts.push({
          title: `Post about ${topic}`,
          content,
          author: user.name,
          authorId: user._id,
          tags: [topic],
          likes: likesCount,
          likedBy: likedBy,
          images,
          visibility: getRandomVisibility(), // 10% private, 20% followers, 70% public
          isPublished: true,
          createdAt: new Date(Date.now() - Math.random() * 1095 * 24 * 60 * 60 * 1000), // Random date in last 3 years
        });
      }

      try {
        await Post.insertMany(posts, { ordered: false });
        progress.update(batchSize);
      } catch (error) {
        console.error(`\nError inserting posts for user ${user.username}:`, error.message);
        progress.update(batchSize);
      }
    }
  }
  
  console.log(`\n✅ Posts with images: ${postsWithImages.toLocaleString()}`);
}

async function createRandomFollowRelationships(users) {
  console.log('\n👥 Creating follow relationships with community clusters...');
  
  const totalRelationships = CONFIG.TOTAL_USERS * 20; // Average 20 follows per user
  const progress = new ProgressTracker(totalRelationships, 'Relationships');
  const session = getNeo4jSession();

  try {
    const relationships = [];
    
    // CHIẾN LƯỢC TẠO CỘNG ĐỒNG:
    // 1. Chia users thành các cộng đồng (clusters) - mỗi cộng đồng 50-100 người
    // 2. Trong cùng cộng đồng: 70% follows (high density)
    // 3. Giữa các cộng đồng: 30% follows (bridges)
    
    const clusterSize = 50; // Mỗi cộng đồng trung bình 50 người
    const numClusters = Math.ceil(users.length / clusterSize);
    const clusters = [];
    
    // Chia users vào các clusters
    for (let i = 0; i < numClusters; i++) {
      const start = i * clusterSize;
      const end = Math.min(start + clusterSize, users.length);
      clusters.push(users.slice(start, end));
    }
    
    console.log(`Created ${numClusters} communities with ~${clusterSize} users each`);

    for (const user of users) {
      // Tìm cluster của user này
      const userClusterIndex = clusters.findIndex(cluster => 
        cluster.some(u => u._id.toString() === user._id.toString())
      );
      const userCluster = clusters[userClusterIndex];
      
      const followCount = Math.floor(Math.random() * 20) + 10; // 10-30 follows
      const followedUsers = new Set();
      
      // 70% follows từ cùng cluster (bạn bè gần)
      const sameClusterFollows = Math.floor(followCount * 0.7);
      for (let i = 0; i < sameClusterFollows; i++) {
        const randomUser = randomElement(userCluster);
        
        if (randomUser._id.toString() !== user._id.toString() && 
            !followedUsers.has(randomUser._id.toString())) {
          followedUsers.add(randomUser._id.toString());
          
          relationships.push({
            followerId: user._id.toString(),
            followeeId: randomUser._id.toString(),
          });
        }
      }
      
      // 30% follows từ clusters khác (bridges giữa cộng đồng)
      const crossClusterFollows = followCount - followedUsers.size;
      for (let i = 0; i < crossClusterFollows; i++) {
        const randomCluster = randomElement(clusters);
        const randomUser = randomElement(randomCluster);
        
        if (randomUser._id.toString() !== user._id.toString() && 
            !followedUsers.has(randomUser._id.toString())) {
          followedUsers.add(randomUser._id.toString());
          
          relationships.push({
            followerId: user._id.toString(),
            followeeId: randomUser._id.toString(),
          });
        }
      }
    }

    // Insert relationships in batches
    for (let i = 0; i < relationships.length; i += CONFIG.NEO4J_BATCH_SIZE) {
      const batch = relationships.slice(i, i + CONFIG.NEO4J_BATCH_SIZE);
      
      const query = `
        UNWIND $rels as rel
        MATCH (follower:User {id: rel.followerId})
        MATCH (followee:User {id: rel.followeeId})
        MERGE (follower)-[r:FOLLOWS]->(followee)
        ON CREATE SET r.since = datetime()
      `;

      await session.run(query, { rels: batch });
      progress.update(batch.length);
    }
    
    console.log(`\n✅ Created ${relationships.length.toLocaleString()} relationships`);
    console.log(`   - Within communities: ~70%`);
    console.log(`   - Between communities: ~30%`);
  } finally {
    await session.close();
  }
}

async function createCommentsForPosts(users) {
  console.log('\n💬 Creating comments for 200 posts (3-5 comments each, 20 recent posts)...');
  
  // OPTIMIZATION: Không load tất cả posts vào RAM
  // Chỉ lấy _id để chọn, sau đó query từng batch nhỏ
  
  // Get 20 most recent post IDs
  const recentPostIds = await Post.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .select('_id createdAt')
    .lean();
  
  console.log(`Found ${recentPostIds.length} recent posts`);
  
  // Get 180 random older post IDs
  const totalPosts = await Post.countDocuments();
  const skipCount = 20; // Skip the 20 most recent
  
  // Limit to 2000 posts to prevent memory issues when shuffling
  const sampleSize = Math.min(2000, totalPosts - skipCount);
  const olderPostIds = await Post.find()
    .sort({ createdAt: -1 })
    .skip(skipCount)
    .limit(sampleSize)
    .select('_id createdAt')
    .lean();
  
  // Randomly select 180 from older posts
  const shuffled = [...olderPostIds].sort(() => Math.random() - 0.5);
  const selectedOlderIds = shuffled.slice(0, 180);
  
  // Combine: 20 recent + 180 random = 200 posts
  const selectedPostIds = [...recentPostIds, ...selectedOlderIds];
  
  console.log(`Selected ${selectedPostIds.length} posts to receive comments (${recentPostIds.length} recent + ${selectedOlderIds.length} random)`);
  
  const progress = new ProgressTracker(selectedPostIds.length, 'Posts with comments');
  let totalComments = 0;
  
  // Process in batches to avoid memory issues
  const BATCH_SIZE = 50;
  
  for (let batchIndex = 0; batchIndex < selectedPostIds.length; batchIndex += BATCH_SIZE) {
    const batchIds = selectedPostIds.slice(batchIndex, batchIndex + BATCH_SIZE);
    const commentsToInsert = [];
    
    for (const postData of batchIds) {
      const commentCount = Math.floor(Math.random() * 3) + 3; // 3-5 comments
      
      // Create comments for this post
      for (let i = 0; i < commentCount; i++) {
        const commenter = randomElement(users);
        const template = randomElement(commentTemplates);
        const content = template.replace('{topic}', randomElement(topics));
        
        const comment = {
          content,
          author: commenter.name,
          authorId: commenter._id,
          authorAvatar: commenter.avatar,
          postId: postData._id,
          parentCommentId: null,
          likes: Math.floor(Math.random() * 20),
          likedBy: [],
          images: [],
          isVisible: true,
          createdAt: new Date(postData.createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000), // Within 24h after post
        };
        
        commentsToInsert.push(comment);
        totalComments++;
      }
      
      progress.update(1);
    }
    
    // Insert batch of comments
    try {
      if (commentsToInsert.length > 0) {
        await Comment.insertMany(commentsToInsert);
      }
    } catch (error) {
      console.error(`\nError creating comments batch:`, error.message);
    }
  }
  
  console.log(`\n✅ Created ${totalComments.toLocaleString()} comments`);
}

async function getStats() {
  console.log('\n📊 Getting statistics...');
  
  const userCount = await User.countDocuments();
  const postCount = await Post.countDocuments();
  const commentCount = await Comment.countDocuments();
  
  const session = getNeo4jSession();
  const result = await session.run(`
    MATCH ()-[r:FOLLOWS]->()
    RETURN count(r) as relationshipCount
  `);
  await session.close();
  
  const relationshipCount = result.records[0]?.get('relationshipCount').toNumber() || 0;

  return {
    users: userCount,
    posts: postCount,
    comments: commentCount,
    relationships: relationshipCount,
  };
}

// Main execution
async function main() {
  console.log('🚀 Starting Large Dataset Seeder');
  console.log(`📊 Configuration:`);
  console.log(`   - Users: ${CONFIG.TOTAL_USERS.toLocaleString()}`);
  console.log(`   - Posts per user: ${CONFIG.POSTS_PER_USER.toLocaleString()}`);
  console.log(`   - Total posts: ${(CONFIG.TOTAL_USERS * CONFIG.POSTS_PER_USER).toLocaleString()}`);
  console.log(`   - Estimated time: 10-20 minutes (depending on hardware)\n`);

  const startTime = Date.now();

  try {
    // Connect to databases
    console.log('🔌 Connecting to databases...');
    await connectMongoDB();
    await connectNeo4j();
    console.log('✅ Connected to MongoDB and Neo4j\n');

    // Step 1: Generate users
    const users = await generateUsers();
    
    // Step 2: Insert users to MongoDB
    const insertedUsers = await insertUsersBatch(users);
    console.log(`✅ Inserted ${insertedUsers.length} users to MongoDB`);

    // Step 3: Insert users to Neo4j
    await insertUsersToNeo4j(insertedUsers);
    console.log('✅ Inserted users to Neo4j');

    // Step 4: Generate and insert posts
    await generateAndInsertPosts(insertedUsers);
    console.log('✅ Inserted all posts');

    // Step 5: Create follow relationships
    await createRandomFollowRelationships(insertedUsers);
    console.log('✅ Created follow relationships');

    // Step 6: Create comments for posts
    await createCommentsForPosts(insertedUsers);
    console.log('✅ Created comments');

    // Step 7: Get final stats
    const stats = await getStats();
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('='.repeat(60));
    console.log('✨ SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`📊 Final Statistics:`);
    console.log(`   - Total Users: ${stats.users.toLocaleString()}`);
    console.log(`   - Total Posts: ${stats.posts.toLocaleString()}`);
    console.log(`   - Total Comments: ${stats.comments.toLocaleString()}`);
    console.log(`   - Total Relationships: ${stats.relationships.toLocaleString()}`);
    console.log(`   - Total Time: ${totalTime}s`);
    console.log(`   - Posts/second: ${(stats.posts / totalTime).toFixed(2)}`);
    console.log('='.repeat(60));
    console.log('\n🎉 You can now use the application with the seeded data!');
    console.log('📝 Default password for all users: 123456@aB\n');

  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    logger.error('Seeding error:', error);
    process.exit(1);
  } finally {
    // Close connections
    await mongoose.connection.close();
    console.log('Closed MongoDB connection');
    process.exit(0);
  }
}

// Run the seeder
main();
