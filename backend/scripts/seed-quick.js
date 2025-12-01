/**
 * Quick Seeder - Smaller dataset for testing
 * 100 users với 50 posts mỗi người
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load sample images list
const imagesListPath = path.join(__dirname, 'sample-images-list.json');
const SAMPLE_IMAGES = fs.existsSync(imagesListPath) 
  ? JSON.parse(fs.readFileSync(imagesListPath, 'utf-8'))
  : [];

const CONFIG = {
  TOTAL_USERS: 100,
  POSTS_PER_USER: 50,
  USER_BATCH_SIZE: 50,
  POST_BATCH_SIZE: 500,
};

const firstNames = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Blake'];
const lastNames = ['Chen', 'Kumar', 'Garcia', 'Patel', 'Kim', 'Silva', 'Nguyen', 'Ali', 'Lopez', 'Wang'];
const topics = ['Tech', 'Science', 'Travel', 'Food', 'Sports', 'Music', 'Art', 'Books', 'Movies', 'Gaming'];

const postTemplates = [
  "Exploring {topic} today! 🚀",
  "My journey with {topic} continues...",
  "Just discovered something amazing about {topic}!",
  "Thoughts on {topic}? Let me know!",
  "Why {topic} matters to me.",
];

const commentTemplates = [
  "Great post!",
  "Very interesting perspective!",
  "Thanks for sharing!",
  "I agree with this.",
  "Learned something new!",
];

const replyTemplates = [
  "Thanks!",
  "Glad you liked it!",
  "Appreciate it!",
];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomVisibility() {
  const rand = Math.random();
  if (rand < 0.10) return 'private';      // 10% private
  if (rand < 0.30) return 'followers';   // 20% followers
  return 'public';                        // 70% public
}

async function seedQuick() {
  console.log('🚀 Quick Seeder - Test Dataset');
  console.log(`📊 ${CONFIG.TOTAL_USERS} users x ${CONFIG.POSTS_PER_USER} posts = ${CONFIG.TOTAL_USERS * CONFIG.POSTS_PER_USER} posts\n`);

  const startTime = Date.now();

  try {
    await connectMongoDB();
    await connectNeo4j();
    console.log('✅ Connected to databases\n');

    // Generate users
    console.log('👥 Generating users...');
    const hashedPassword = await bcrypt.hash('123456@aB', 10);
    const users = [];

    for (let i = 0; i < CONFIG.TOTAL_USERS; i++) {
      const firstName = randomElement(firstNames);
      const lastName = randomElement(lastNames);
      const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}${i}`;

      users.push({
        username,
        email: `${username}@example.com`,
        password: hashedPassword,
        name: `${firstName} ${lastName}`,
        bio: `Passionate about ${randomElement(topics)}`,
        role: 'user',
      });
    }

    // Insert users to MongoDB
    console.log('💾 Inserting users to MongoDB...');
    const insertedUsers = await User.insertMany(users, { ordered: false });
    console.log(`✅ Inserted ${insertedUsers.length} users`);

    // Insert users to Neo4j
    console.log('🔗 Inserting users to Neo4j...');
    const session = getNeo4jSession();
    const userParams = insertedUsers.map(u => ({
      id: u._id.toString(),
      username: u.username,
      email: u.email,
      name: u.name,
      role: u.role,
    }));

    await session.run(`
      UNWIND $users as user
      MERGE (u:User {id: user.id})
      SET u.username = user.username,
          u.email = user.email,
          u.name = user.name,
          u.role = user.role
    `, { users: userParams });
    await session.close();
    console.log('✅ Inserted users to Neo4j');

    // Insert posts with 50% having images
    console.log('📝 Inserting posts (50% with images)...');
    let totalPosts = 0;
    let postsWithImages = 0;

    for (const user of insertedUsers) {
      const posts = [];
      for (let i = 0; i < CONFIG.POSTS_PER_USER; i++) {
        const topic = randomElement(topics);
        const template = randomElement(postTemplates);
        
        // 50% chance to have images
        const hasImages = Math.random() < 0.5;
        const images = hasImages && SAMPLE_IMAGES.length > 0
          ? [
              randomElement(SAMPLE_IMAGES),
              ...(Math.random() < 0.3 ? [randomElement(SAMPLE_IMAGES)] : []) // 30% chance for 2 images
            ]
          : [];
        
        if (images.length > 0) postsWithImages++;
        
        // Generate realistic likes
        const likesCount = Math.floor(Math.random() * 50);
        const likedBy = [];
        
        if (likesCount > 0) {
          const maxLikers = Math.min(likesCount, insertedUsers.length);
          const selectedLikers = new Set();
          
          while (selectedLikers.size < maxLikers) {
            const randomUser = randomElement(insertedUsers);
            selectedLikers.add(randomUser._id.toString());
          }
          
          likedBy.push(...Array.from(selectedLikers));
        }
        
        posts.push({
          title: `Post about ${topic}`,
          content: template.replace('{topic}', topic),
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
      await Post.insertMany(posts);
      totalPosts += posts.length;
    }
    console.log(`✅ Inserted ${totalPosts} posts (${postsWithImages} with images)`);

    // Create follow relationships
    console.log('👥 Creating relationships...');
    const session2 = getNeo4jSession();
    const relationships = [];

    for (const user of insertedUsers) {
      const followCount = Math.floor(Math.random() * 10) + 5;
      for (let i = 0; i < followCount; i++) {
        const randomUser = randomElement(insertedUsers);
        if (randomUser._id.toString() !== user._id.toString()) {
          relationships.push({
            followerId: user._id.toString(),
            followeeId: randomUser._id.toString(),
          });
        }
      }
    }

    await session2.run(`
      UNWIND $rels as rel
      MATCH (follower:User {id: rel.followerId})
      MATCH (followee:User {id: rel.followeeId})
      MERGE (follower)-[r:FOLLOWS]->(followee)
      ON CREATE SET r.since = datetime()
    `, { rels: relationships });
    await session2.close();
    console.log(`✅ Created ${relationships.length} relationships`);

    // Create comments for 10% of posts
    console.log('💬 Creating comments...');
    const allPosts = await Post.find();
    const postsWithComments = allPosts.filter(() => Math.random() < 0.10);
    let totalComments = 0;
    
    for (const post of postsWithComments) {
      const commentCount = Math.floor(Math.random() * 6) + 5; // 5-10 comments
      const comments = [];
      
      for (let i = 0; i < commentCount; i++) {
        const commenter = randomElement(insertedUsers);
        const hasImage = Math.random() < 0.10 && SAMPLE_IMAGES.length > 0;
        
        comments.push({
          content: randomElement(commentTemplates),
          author: commenter.name,
          authorId: commenter._id,
          postId: post._id,
          parentCommentId: null,
          likes: Math.floor(Math.random() * 10),
          images: hasImage ? [randomElement(SAMPLE_IMAGES)] : [],
          isVisible: true,
          createdAt: new Date(post.createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000),
        });
        totalComments++;
      }
      
      const inserted = await Comment.insertMany(comments);
      
      // Add some replies (30% chance)
      if (Math.random() < 0.30 && inserted.length > 0) {
        const parent = randomElement(inserted);
        const replier = randomElement(insertedUsers);
        await Comment.create({
          content: randomElement(replyTemplates),
          author: replier.name,
          authorId: replier._id,
          postId: post._id,
          parentCommentId: parent._id,
          likes: 0,
          images: [],
          isVisible: true,
          createdAt: new Date(parent.createdAt.getTime() + Math.random() * 12 * 60 * 60 * 1000),
        });
        totalComments++;
      }
    }
    console.log(`✅ Created ${totalComments} comments for ${postsWithComments.length} posts`);

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(50));
    console.log('✨ QUICK SEEDING COMPLETED!');
    console.log('='.repeat(50));
    console.log(`⏱️  Time: ${totalTime}s`);
    console.log(`👥 Users: ${insertedUsers.length}`);
    console.log(`📝 Posts: ${totalPosts}`);
    console.log(`🔗 Relationships: ${relationships.length}`);
    console.log('🔑 Password: password123');
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedQuick();
