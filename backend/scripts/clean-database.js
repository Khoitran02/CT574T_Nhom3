/**
 * Clean Database - Remove all seeded data
 * CẢNH BÁO: Script này sẽ xóa TOÀN BỘ dữ liệu!
 */

import mongoose from 'mongoose';
import readline from 'readline';
import { connectMongoDB } from '../config/database.js';
import { connectNeo4j, getNeo4jSession } from '../config/database.js';
import User from '../models/users.model.js';
import Post from '../models/posts.model.js';
import Comment from '../models/comments.model.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function cleanDatabase() {
  console.log('\n' + '⚠️ '.repeat(30));
  console.log('⚠️  WARNING: DATABASE CLEANUP SCRIPT');
  console.log('⚠️  This will DELETE ALL data from:');
  console.log('⚠️  - MongoDB (Users, Posts, Comments)');
  console.log('⚠️  - Neo4j (Users, Relationships)');
  console.log('⚠️ '.repeat(30) + '\n');

  const confirm1 = await askQuestion('Are you sure you want to continue? (yes/no): ');
  if (confirm1.toLowerCase() !== 'yes') {
    console.log('❌ Cleanup cancelled.');
    process.exit(0);
  }

  const confirm2 = await askQuestion('Type "DELETE ALL DATA" to confirm: ');
  if (confirm2 !== 'DELETE ALL DATA') {
    console.log('❌ Cleanup cancelled.');
    process.exit(0);
  }

  console.log('\n🔄 Starting cleanup...\n');
  const startTime = Date.now();

  try {
    // Connect
    await connectMongoDB();
    await connectNeo4j();
    console.log('✅ Connected to databases\n');

    // Get counts before deletion
    const userCount = await User.countDocuments();
    const postCount = await Post.countDocuments();
    const commentCount = await Comment.countDocuments();
    
    const session = getNeo4jSession();
    
    // Count nodes
    const nodeResult = await session.run(`
      MATCH (n:User)
      RETURN count(n) as nodes
    `);
    const nodeCount = nodeResult.records[0]?.get('nodes').toNumber() || 0;
    
    // Count relationships separately to avoid memory issues
    const relResult = await session.run(`
      MATCH ()-[r:FOLLOWS]->()
      RETURN count(r) as relationships
    `);
    const relCount = relResult.records[0]?.get('relationships').toNumber() || 0;
    
    await session.close();

    console.log('📊 Current data:');
    console.log(`   MongoDB:`);
    console.log(`     - Users: ${userCount.toLocaleString()}`);
    console.log(`     - Posts: ${postCount.toLocaleString()}`);
    console.log(`     - Comments: ${commentCount.toLocaleString()}`);
    console.log(`   Neo4j:`);
    console.log(`     - Nodes: ${nodeCount.toLocaleString()}`);
    console.log(`     - Relationships: ${relCount.toLocaleString()}\n`);

    // Delete from MongoDB in batches for large datasets
    console.log('🗑️  Deleting from MongoDB...');
    
    // Delete comments (usually fewer)
    const deleteComments = await Comment.deleteMany({});
    console.log(`   ✅ Deleted ${deleteComments.deletedCount.toLocaleString()} comments`);
    
    // Delete posts in batches (to avoid timeout on large datasets)
    let totalDeletedPosts = 0;
    const POST_BATCH_SIZE = 50000;
    let postsRemaining = true;
    
    while (postsRemaining) {
      // Find batch of post IDs
      const postIds = await Post.find({}, { _id: 1 }).limit(POST_BATCH_SIZE).lean();
      
      if (postIds.length === 0) {
        postsRemaining = false;
        break;
      }
      
      // Delete this batch
      const deleteResult = await Post.deleteMany({ 
        _id: { $in: postIds.map(p => p._id) }
      });
      
      const deleted = deleteResult.deletedCount;
      totalDeletedPosts += deleted;
      
      process.stdout.write(`\r   🔄 Deleting posts... ${totalDeletedPosts.toLocaleString()}`);
      
      // If we got fewer than batch size, we're done
      if (postIds.length < POST_BATCH_SIZE) {
        postsRemaining = false;
      }
    }
    console.log(`\n   ✅ Deleted ${totalDeletedPosts.toLocaleString()} posts`);
    
    // Delete users (after posts to maintain referential integrity)
    const deleteUsers = await User.deleteMany({});
    console.log(`   ✅ Deleted ${deleteUsers.deletedCount.toLocaleString()} users`);

    // Delete from Neo4j (in batches to avoid memory issues)
    console.log('\n🗑️  Deleting from Neo4j...');
    const session2 = getNeo4jSession();
    
    // Delete ALL relationships in batches (not just FOLLOWS)
    let totalDeletedRels = 0;
    let batchDeletedRels = 0;
    do {
      const delRels = await session2.run(`
        MATCH ()-[r]->()
        WITH r LIMIT 10000
        DELETE r
        RETURN count(r) as deleted
      `);
      batchDeletedRels = delRels.records[0]?.get('deleted').toNumber() || 0;
      totalDeletedRels += batchDeletedRels;
      if (batchDeletedRels > 0) {
        process.stdout.write(`\r   🔄 Deleting relationships... ${totalDeletedRels.toLocaleString()}`);
      }
    } while (batchDeletedRels > 0);
    console.log(`\n   ✅ Deleted ${totalDeletedRels.toLocaleString()} relationships`);
    
    // Delete ALL nodes in batches (User, Post, etc.)
    let totalDeletedNodes = 0;
    let batchDeletedNodes = 0;
    do {
      const delNodes = await session2.run(`
        MATCH (n)
        WITH n LIMIT 10000
        DELETE n
        RETURN count(n) as deleted
      `);
      batchDeletedNodes = delNodes.records[0]?.get('deleted').toNumber() || 0;
      totalDeletedNodes += batchDeletedNodes;
      if (batchDeletedNodes > 0) {
        process.stdout.write(`\r   🔄 Deleting nodes... ${totalDeletedNodes.toLocaleString()}`);
      }
    } while (batchDeletedNodes > 0);
    console.log(`\n   ✅ Deleted ${totalDeletedNodes.toLocaleString()} nodes`);
    
    await session2.close();

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(50));
    console.log('✨ CLEANUP COMPLETED!');
    console.log('='.repeat(50));
    console.log(`⏱️  Time: ${totalTime}s`);
    console.log(`📊 Deleted:`);
    console.log(`   - Users: ${deleteUsers.deletedCount.toLocaleString()}`);
    console.log(`   - Posts: ${totalDeletedPosts.toLocaleString()}`);
    console.log(`   - Comments: ${deleteComments.deletedCount.toLocaleString()}`);
    console.log(`   - Neo4j Nodes: ${totalDeletedNodes.toLocaleString()}`);
    console.log(`   - Neo4j Relationships: ${totalDeletedRels.toLocaleString()}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

cleanDatabase();
