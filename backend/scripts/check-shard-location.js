import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectMongoDB, getMongoConnection, closeMongoConnection } from '../config/mongodb.js';

dotenv.config();

/**
 * Tìm record trên từng shard trực tiếp
 */
async function findRecordOnShards(collectionName, recordId) {
  try {
    const connection = getMongoConnection();
    const client = connection.getClient?.() || connection.client;
    const adminDb = client.db('admin');
    const dbName = process.env.MONGO_DATABASE || 'socialnetwork';
    
    let queryId = recordId;
    if (mongoose.Types.ObjectId.isValid(recordId)) {
      queryId = new mongoose.Types.ObjectId(recordId);
    }
    
    const shardStatus = await adminDb.command({ listShards: 1 });
    
    console.log(`\nTìm kiếm record trên ${shardStatus.shards.length} shards`);
    console.log(`Collection: ${collectionName}, ID: ${recordId}\n`);
    
    for (const shard of shardStatus.shards) {
      try {
        const shardHost = shard.host.split('/')[1] || shard.host;
        const shardConn = await mongoose.createConnection(
          `mongodb://${shardHost}/${dbName}`,
          { serverSelectionTimeoutMS: 2000 }
        ).asPromise();
        
        const collection = shardConn.db.collection(collectionName);
        const record = await collection.findOne({ _id: queryId });
        
        if (record) {
          console.log(`TÌM THẤY trên ${shard._id}`);
          console.log(`   Host: ${shard.host}`);
          console.log(`   Data: ${JSON.stringify(record, null, 2)}`);
        } else {
          console.log(`○  Không có trên ${shard._id}`);
        }
        
        await shardConn.close();
      } catch (error) {
        console.log(`Lỗi khi truy vấn ${shard._id}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Lỗi:', error.message);
  }
}

/**
 * Kiểm tra thông tin sharding của collection
 */
async function checkShardLocation(collectionName, recordId) {
  try {
    const connection = getMongoConnection();
    const dbName = process.env.MONGO_DATABASE || 'socialnetwork';
    const db = connection.useDb(dbName);
    
    let queryId = recordId;
    if (mongoose.Types.ObjectId.isValid(recordId)) {
      queryId = new mongoose.Types.ObjectId(recordId);
    }
    
    const client = connection.getClient?.() || connection.client;
    const configDb = client.db('config');
    
    const shardInfo = await configDb.collection('collections').findOne({
      _id: `${dbName}.${collectionName}`
    });
    
    console.log(`\nCollection: ${collectionName}`);
    
    if (shardInfo) {
      console.log(`Đã enable sharding`);
      console.log(`Shard key: ${JSON.stringify(shardInfo.key)}`);
      
      const collection = db.collection(collectionName);
      const record = await collection.findOne({ _id: queryId });
      
      if (!record) {
        console.log(`Không tìm thấy record với ID: ${recordId}`);
        return;
      }
      
      console.log(`\nRecord tìm thấy:`);
      console.log(JSON.stringify(record, null, 2));
      
      // MongoDB 8.2+ sử dụng chunk metadata khác
      const chunks = await configDb.collection('chunks')
        .find({ uuid: shardInfo.uuid })
        .toArray();
      
      console.log(`\nChunk info:`);
      console.log(`  Total chunks: ${chunks.length}`);
      
      if (chunks.length > 0) {
        const shardDist = {};
        chunks.forEach(chunk => {
          shardDist[chunk.shard] = (shardDist[chunk.shard] || 0) + 1;
        });
        
        console.log(`  Distribution:`);
        for (const [shard, count] of Object.entries(shardDist)) {
          console.log(`    ${shard}: ${count} chunks`);
        }
        
        // Tìm chunk chứa record này
        const hashedId = mongoose.Types.ObjectId.isValid(recordId) 
          ? new mongoose.Types.ObjectId(recordId) 
          : recordId;
        
        console.log(`\nRecord location:`);
        // Với hashed shard key, cần query thực tế để biết shard
        const explain = await collection.find({ _id: queryId }).explain('executionStats');
        
        if (explain.shards) {
          let found = false;
          for (const [shardName, shardStats] of Object.entries(explain.shards)) {
            if (shardStats.executionStats && shardStats.executionStats.nReturned > 0) {
              console.log(`Shard: ${shardName}`);
              console.log(`     Documents returned: ${shardStats.executionStats.nReturned}`);
              found = true;
            }
          }
          if (!found) {
            console.log(`Không xác định được shard (có thể do broadcast query)`);
          }
        } else {
          console.log(`Sử dụng --direct để query trực tiếp từng shard`);
        }
      } else {
        console.log(`Không có chunks - data chưa được phân tán!`);
        console.log(`Sử dụng --direct để xem record nằm ở shard nào`);
      }
    } else {
      console.log(`Collection chưa được shard`);
    }
  } catch (error) {
    console.error('Lỗi:', error.message);
  }
}

/**
 * Hiển thị danh sách shards
 */
async function listShards() {
  try {
    const connection = getMongoConnection();
    const client = connection.getClient?.() || connection.client;
    const adminDb = client.db('admin');
    
    const shardStatus = await adminDb.command({ listShards: 1 });
    
    console.log('\n🔷 Danh sách Shards:\n');
    shardStatus.shards.forEach((shard, index) => {
      console.log(`  ${index + 1}. ${shard._id}`);
      console.log(`     Host: ${shard.host}`);
      console.log(`     State: ${shard.state}`);
    });
  } catch (error) {
    console.warn('Không thể lấy danh sách shards:', error.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('\nCách sử dụng:');
    console.log('  node check-shard-location.js <collection> <recordId>');
    console.log('  node check-shard-location.js --direct <collection> <recordId>');
    console.log('  node check-shard-location.js --list-shards\n');
    console.log('Ví dụ:');
    console.log('  node check-shard-location.js users 507f1f77bcf86cd799439011');
    console.log('  node check-shard-location.js --direct users 507f1f77bcf86cd799439011');
    console.log('  node check-shard-location.js --list-shards\n');
    process.exit(0);
  }
  
  try {
    await connectMongoDB();
    
    if (args[0] === '--list-shards') {
      await listShards();
    } else if (args[0] === '--direct' && args.length >= 3) {
      await findRecordOnShards(args[1], args[2]);
    } else if (args.length >= 2) {
      await checkShardLocation(args[0], args[1]);
    } else {
      console.error('Tham số không hợp lệ.');
    }
  } catch (error) {
    console.error('Lỗi:', error.message);
  } finally {
    await closeMongoConnection();
  }
}

main();
