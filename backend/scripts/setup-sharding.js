import dotenv from 'dotenv';
import { connectMongoDB, getMongoConnection, closeMongoConnection } from '../config/mongodb.js';

dotenv.config();

/**
 * QUAN TRỌNG
 * Script này PHẢI chạy TRƯỚC KHI seed data
 * Mục đích: Setup sharding để MongoDB tạo chunks khi insert data đầu tiên
 */
async function setupSharding() {
  try {
    await connectMongoDB();
    
    const connection = getMongoConnection();
    const client = connection.getClient?.() || connection.client;
    const adminDb = client.db('admin');
    const dbName = process.env.MONGO_DATABASE || 'socialnetwork';
    
    console.log('\n  SETUP SHARDING\n');
    console.log('='.repeat(60));
    
    // Shard collections với hashed key để phân bố đều
    console.log('\n Sharding collections...\n');
    
    try {
      await adminDb.command({
        shardCollection: `${dbName}.users`,
        key: { _id: 'hashed' },
        numInitialChunks: 3
      });
      console.log('    users: Sharded với _id (hashed)');
    } catch (error) {
      if (error.message.includes('already')) {
        console.log('   ○ users: Đã được shard');
      } else {
        throw error;
      }
    }
    
    try {
      await adminDb.command({
        shardCollection: `${dbName}.posts`,
        key: { authorId: 'hashed' },
        numInitialChunks: 3
      });
      console.log('    posts: Sharded với authorId (hashed)');
    } catch (error) {
      if (error.message.includes('already')) {
        console.log('   ○ posts: Đã được shard');
      } else {
        throw error;
      }
    }
    
    try {
      await adminDb.command({
        shardCollection: `${dbName}.comments`,
        key: { postId: 'hashed' },
        numInitialChunks: 3
      });
      console.log('    comments: Sharded với postId (hashed)');
    } catch (error) {
      if (error.message.includes('already')) {
        console.log('   ○ comments: Đã được shard');
      } else {
        throw error;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n HOÀN TẤT!\n');
    console.log(' Bước tiếp theo: Chạy seed data');
    console.log('   npm run seed:admin\n');
    console.log(' Chunks sẽ tự động được tạo khi insert data đầu tiên\n');
    
  } catch (error) {
    console.error('\n Lỗi:', error.message);
    process.exit(1);
  } finally {
    await closeMongoConnection();
  }
}

setupSharding();
