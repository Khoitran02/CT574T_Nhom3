import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectMongoDB, getMongoConnection, closeMongoConnection } from '../config/mongodb.js';

dotenv.config();

/**
 * Test failover khi tắt 1 shard
 * Kiểm tra xem dữ liệu có còn truy cập được không
 */

async function getShardStats() {
  const connection = getMongoConnection();
  const client = connection.getClient?.() || connection.client;
  const adminDb = client.db('admin');
  
  const shardStatus = await adminDb.command({ listShards: 1 });
  return shardStatus.shards;
}

async function testDataAccess(collectionName, sampleSize = 5) {
  const connection = getMongoConnection();
  const dbName = process.env.MONGO_DATABASE || 'socialnetwork';
  const db = connection.useDb(dbName);
  const collection = db.collection(collectionName);
  
  const records = await collection.find({}).limit(sampleSize).toArray();
  
  console.log(`\n Test truy cập ${collectionName}:`);
  console.log(`   Tổng số records tìm thấy: ${records.length}`);
  
  if (records.length > 0) {
    console.log(`    Dữ liệu vẫn truy cập được`);
    // Chỉ hiển thị 2 records đầu tiên
    const displayCount = Math.min(2, records.length);
    for (let i = 0; i < displayCount; i++) {
      console.log(`   ${i + 1}. ID: ${records[i]._id}`);
    }
    if (records.length > 2) {
      console.log(`   ... và ${records.length - 2} records khác`);
    }
  } else {
    console.log(`     Không tìm thấy dữ liệu`);
  }
  
  return records.length;
}

async function checkShardHealth() {
  const connection = getMongoConnection();
  const client = connection.getClient?.() || connection.client;
  const adminDb = client.db('admin');
  
  console.log('\n Kiểm tra sức khỏe shards:\n');
  
  try {
    const shards = await getShardStats();
    
    for (const shard of shards) {
      const shardHost = shard.host.split('/')[1] || shard.host;
      
      try {
        const shardConn = await mongoose.createConnection(
          `mongodb://${shardHost}/admin`,
          { 
            serverSelectionTimeoutMS: 3000,
            connectTimeoutMS: 3000 
          }
        ).asPromise();
        
        await shardConn.db.admin().ping();
        console.log(` ${shard._id.padEnd(10)} - ONLINE  (${shardHost})`);
        await shardConn.close();
        
      } catch (error) {
        console.log(` ${shard._id.padEnd(10)} - OFFLINE (${shardHost})`);
        console.log(`   Lỗi: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(' Không thể kiểm tra shard health:', error.message);
  }
}

async function testChunkDistribution() {
  const connection = getMongoConnection();
  const client = connection.getClient?.() || connection.client;
  const configDb = client.db('config');
  
  console.log('\n Phân bố chunks:\n');
  
  const collections = ['users', 'posts', 'comments'];
  const dbName = process.env.MONGO_DATABASE || 'socialnetwork';
  
  for (const collName of collections) {
    // MongoDB 8.2+ uses uuid instead of ns
    const collInfo = await configDb.collection('collections').findOne({
      _id: `${dbName}.${collName}`
    });
    
    if (!collInfo || !collInfo.uuid) {
      console.log(`${collName.padEnd(10)} - Chưa enable sharding`);
      continue;
    }
    
    const chunks = await configDb.collection('chunks').find({
      uuid: collInfo.uuid
    }).toArray();
    
    if (chunks.length === 0) {
      console.log(`${collName.padEnd(10)} - Chưa có chunks (data chưa đủ lớn để split)`);
      continue;
    }
    
    const chunksByShard = {};
    chunks.forEach(chunk => {
      chunksByShard[chunk.shard] = (chunksByShard[chunk.shard] || 0) + 1;
    });
    
    console.log(`${collName.padEnd(10)} - Tổng: ${chunks.length} chunks`);
    Object.entries(chunksByShard).forEach(([shard, count]) => {
      console.log(`   ${shard}: ${count} chunks`);
    });
  }
}

async function runFailoverTest() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   MongoDB Shard Failover Test             ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  try {
    console.log(' Kết nối MongoDB...');
    await connectMongoDB();
    console.log(' Đã kết nối\n');
    
    // 1. Kiểm tra sức khỏe shards
    await checkShardHealth();
    
    // 2. Kiểm tra phân bố chunks
    await testChunkDistribution();
    
    // 3. Test truy cập dữ liệu
    console.log('\n═══════════════════════════════════════════\n');
    const usersCount = await testDataAccess('users', 5);
    const postsCount = await testDataAccess('posts', 5);
    const commentsCount = await testDataAccess('comments', 3);
    
    // 4. Kết quả
    console.log('\n═══════════════════════════════════════════');
    console.log('\n Tổng kết:');
    console.log(`   Users accessible: ${usersCount > 0 ? '' : 'x'}`);
    console.log(`   Posts accessible: ${postsCount > 0 ? '' : 'x'}`);
    console.log(`   Comments accessible: ${commentsCount > 0 ? '' : 'x'}`);
    
    console.log('\n Hướng dẫn test failover:');
    console.log('   Test 1 - Tắt Máy 1 (Node1 của tất cả shards):');
    console.log('      .\\script\\stop-machine.ps1 1');
    console.log('      → Mỗi shard còn 2/3 nodes hoạt động');
    console.log('      → Data vẫn accessible');
    console.log('');
    console.log('   Test 2 - Tắt Máy 2 (Node2 của tất cả shards):');
    console.log('      .\\script\\stop-machine.ps1 2');
    console.log('      → Mỗi shard còn 2/3 nodes hoạt động');
    console.log('      → Data vẫn accessible');
    console.log('');
    console.log('   Test 3 - Tắt 2 máy cùng lúc (Chỉ còn 1/3 nodes):');
    console.log('      .\\script\\stop-machine.ps1 1');
    console.log('      .\\script\\stop-machine.ps1 2');
    console.log('      → Mỗi shard chỉ còn 1/3 nodes');
    console.log('      → KHÔNG thể ghi (cần đa số nodes để bầu primary)');
    console.log('      → API trả về HTTP 503 "Service temporarily unavailable"');
    console.log('');
    console.log('   Khởi động lại:');
    console.log('      .\\script\\start-machine.ps1 1');
    console.log('      .\\script\\start-machine.ps1 2\n');
    
  } catch (error) {
    console.error('\n Lỗi:', error.message);
    console.error(error.stack);
  } finally {
    await closeMongoConnection();
    console.log('Đã đóng kết nối.\n');
  }
}

// Chạy test
runFailoverTest().catch(console.error);
