/**
 * Demo Seeder - Tiny dataset để verify scripts hoạt động
 * 10 users với 10 posts mỗi người
 */

import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectMongoDB } from '../config/database.js';
import { connectNeo4j, getNeo4jSession } from '../config/database.js';
import User from '../models/users.model.js';
import Post from '../models/posts.model.js';

console.log('🧪 Demo Seeder - Verify Setup');
console.log('Creating 10 users with 10 posts each...\n');

async function demoSeed() {
  const startTime = Date.now();

  try {
    // Connect
    await connectMongoDB();
    await connectNeo4j();
    console.log('✅ Connected to databases');

    // Create 10 users
    const hashedPassword = await bcrypt.hash('password123', 10);
    const users = [];
    
    for (let i = 1; i <= 10; i++) {
      users.push({
        username: `user${i}`,
        email: `user${i}@demo.com`,
        password: hashedPassword,
        name: `Demo User ${i}`,
        bio: `I am demo user number ${i}`,
        role: 'user',
      });
    }

    const insertedUsers = await User.insertMany(users);
    console.log(`✅ Created ${insertedUsers.length} users`);

    // Add to Neo4j
    const session = getNeo4jSession();
    await session.run(`
      UNWIND $users as user
      MERGE (u:User {id: user.id})
      SET u.username = user.username,
          u.name = user.name
    `, { 
      users: insertedUsers.map(u => ({
        id: u._id.toString(),
        username: u.username,
        name: u.name
      }))
    });
    console.log('✅ Added users to Neo4j');

    // Create posts
    const allPosts = [];

    for (const user of insertedUsers) {
      for (let i = 1; i <= 10; i++) {
        allPosts.push({
          title: `Post ${i} by ${user.username}`,
          content: `This is post number ${i} from ${user.name}. Testing the system!`,
          author: user.name,
          authorId: user._id,
          tags: ['demo', 'test'],
          likes: i,
        });
      }
    }

    await Post.insertMany(allPosts);
    console.log(`✅ Created ${allPosts.length} posts`);

    // Create some follow relationships
    await session.run(`
      MATCH (u1:User), (u2:User)
      WHERE u1.id <> u2.id AND toInteger(substring(u1.username, 4)) <= 5
      MERGE (u1)-[:FOLLOWS]->(u2)
    `);
    console.log('✅ Created follow relationships');
    
    await session.close();

    const time = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✨ Demo completed in ${time}s`);
    console.log('📊 Created: 10 users, 100 posts, ~25 relationships');
    console.log('🔑 Login: user1 / password123\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

demoSeed();
