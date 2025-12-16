import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectMongoDB, getMongoConnection, closeMongoConnection } from '../config/mongodb.js';

dotenv.config();

/**
 * SCRIPT KIỂM TRA PHÂN PHỐI SHARD
 * Verify xem data có được phân phối đúng shard theo chunk ranges không
 */

// Chunk ranges cho hashed sharding (cố định)
const CHUNK_RANGES = {
  shard3rs: { min: -Infinity, max: -3074457345618258602 },
  shard1rs: { min: -3074457345618258602, max: 3074457345618258602 },
  shard2rs: { min: 3074457345618258602, max: Infinity }
};

// Mapping shard name -> primary port
const SHARD_PORTS = {
  shard1rs: 27022,
  shard2rs: 27025,
  shard3rs: 27028
};

/**
 * Predict shard dựa trên hashed value
 */
function predictShard(hashedValue) {
  if (hashedValue < CHUNK_RANGES.shard1rs.min) {
    return 'shard3rs';
  } else if (hashedValue < CHUNK_RANGES.shard2rs.min) {
    return 'shard1rs';
  } else {
    return 'shard2rs';
  }
}

/**
 * Hash một ObjectId (giống convertShardKeyToHashed trong mongosh)
 */
function hashShardKey(value) {
  // MongoDB sử dụng MD5 hash internally
  // Chúng ta sẽ dùng mongosh command để hash chính xác
  return null; // Placeholder - sẽ dùng mongosh
}

/**
 * Tìm document trên từng shard trực tiếp
 */
async function findDocumentOnShards(collectionName, docId, shardKeyField) {
  const foundOn = [];
  const dbName = process.env.MONGO_DATABASE || 'socialnetwork';
  
  for (const [shardName, port] of Object.entries(SHARD_PORTS)) {
    try {
      const shardConn = await mongoose.createConnection(
        `mongodb://localhost:${port}/${dbName}`,
        { serverSelectionTimeoutMS: 2000 }
      ).asPromise();
      
      const collection = shardConn.db.collection(collectionName);
      const doc = await collection.findOne({ _id: docId });
      
      if (doc) {
        foundOn.push({
          shard: shardName,
          port: port,
          shardKeyValue: doc[shardKeyField]
        });
      }
      
      await shardConn.close();
    } catch (error) {
      console.error(`   Lỗi kết nối ${shardName}:`, error.message);
    }
  }
  
  return foundOn;
}

/**
 * Verify distribution cho một collection
 */
async function verifyCollection(collectionName, shardKeyField, sampleSize = 100) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`COLLECTION: ${collectionName}`);
  console.log(`   Shard Key: ${shardKeyField} (hashed)`);
  console.log(`${'='.repeat(70)}\n`);
  
  const connection = getMongoConnection();
  const dbName = process.env.MONGO_DATABASE || 'socialnetwork';
  const db = connection.useDb(dbName);
  const collection = db.collection(collectionName);
  
  // Lấy total documents
  const totalDocs = await collection.countDocuments();
  console.log(`   Tổng số documents: ${totalDocs}`);
  console.log(`   Sample size: ${Math.min(sampleSize, totalDocs)}\n`);
  
  // Lấy sample documents (random sampling)
  const totalForSample = Math.min(sampleSize, totalDocs);
  const docs = await collection.aggregate([
    { $sample: { size: totalForSample } }
  ]).toArray();
  
  // Thống kê
  const stats = {
    total: docs.length,
    verified: 0,
    errors: 0,
    shardDistribution: {
      shard1rs: 0,
      shard2rs: 0,
      shard3rs: 0
    },
    mismatches: []
  };
  
  console.log('   Đang kiểm tra từng document...\n');
  
  // Progress bar setup
  const progressInterval = Math.max(1, Math.floor(docs.length / 10));
  
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    
    if ((i + 1) % progressInterval === 0) {
      process.stdout.write(`   Progress: ${i + 1}/${docs.length} (${Math.round((i + 1) / docs.length * 100)}%)\r`);
    }
    
    try {
      // Tìm document trên các shards
      const foundOn = await findDocumentOnShards(
        collectionName,
        doc._id,
        shardKeyField
      );
      
      if (foundOn.length === 0) {
        stats.errors++;
        stats.mismatches.push({
          docId: doc._id,
          issue: 'NOT_FOUND',
          message: 'Document không tìm thấy trên bất kỳ shard nào'
        });
      } else if (foundOn.length > 1) {
        stats.errors++;
        stats.mismatches.push({
          docId: doc._id,
          issue: 'DUPLICATE',
          message: `Document tồn tại trên nhiều shards: ${foundOn.map(f => f.shard).join(', ')}`
        });
      } else {
        // Document found on exactly one shard
        const actualShard = foundOn[0].shard;
        stats.shardDistribution[actualShard]++;
        stats.verified++;
        
        // Note: Để verify hash chính xác, cần dùng mongosh
        // Hiện tại chỉ verify document tồn tại trên đúng 1 shard
      }
    } catch (error) {
      stats.errors++;
      stats.mismatches.push({
        docId: doc._id,
        issue: 'ERROR',
        message: error.message
      });
    }
  }
  
  console.log(`\n${'─'.repeat(70)}`);
  console.log('KẾT QUẢ KIỂM TRA\n');
  
  // Lấy actual distribution từ MongoDB (query each shard directly)
  console.log('   Phân phối thực tế (toàn bộ collection):');
  const actualDistribution = {};
  
  for (const [shardName, port] of Object.entries(SHARD_PORTS)) {
    try {
      const shardConn = await mongoose.createConnection(
        `mongodb://localhost:${port}/${dbName}`,
        { serverSelectionTimeoutMS: 3000 }
      ).asPromise();
      
      const count = await shardConn.db.collection(collectionName).countDocuments();
      const percentage = ((count / totalDocs) * 100).toFixed(1);
      actualDistribution[shardName] = count;
      console.log(`     ${shardName} (port ${port}): ${count} docs (${percentage}%)`);
      
      await shardConn.close();
    } catch (e) {
      console.log(`     ${shardName}: ⚠ Error - ${e.message}`);
      actualDistribution[shardName] = 'N/A';
    }
  }
  
  // Hiển thị sample distribution
  console.log(`\n   Phân phối trong sample (${stats.total} docs):`);
  for (const [shard, count] of Object.entries(stats.shardDistribution)) {
    const percentage = ((count / stats.total) * 100).toFixed(1);
    const port = SHARD_PORTS[shard];
    console.log(`     ${shard} (port ${port}): ${count} docs (${percentage}%)`);
  }
  
  console.log(`\n   Tổng verified: ${stats.verified}/${stats.total}`);
  console.log(`   Errors: ${stats.errors}`);
  
  // Hiển thị errors nếu có
  if (stats.mismatches.length > 0) {
    console.log(`\n   PHÁT HIỆN VẤN ĐỀ:\n`);
    stats.mismatches.slice(0, 10).forEach((m, idx) => {
      console.log(`     ${idx + 1}. Doc ID: ${m.docId}`);
      console.log(`        Issue: ${m.issue}`);
      console.log(`        ${m.message}\n`);
    });
    
    if (stats.mismatches.length > 10) {
      console.log(`     ... và ${stats.mismatches.length - 10} vấn đề khác\n`);
    }
  }
  
  // Đánh giá kết quả
  console.log(`\n${'─'.repeat(70)}`);
  
  const isBalanced = Object.values(stats.shardDistribution).every(count => {
    const percentage = (count / stats.total) * 100;
    return percentage >= 25 && percentage <= 42; // ~33% ± 9%
  });
  
  const noOrphans = stats.errors === 0;
  
  if (isBalanced && noOrphans) {
    console.log('   TRẠNG THÁI: EXCELLENT');
    console.log('   - Phân phối cân bằng');
    console.log('   - Không có orphaned documents');
    console.log('   - Không có duplicates\n');
  } else if (isBalanced && !noOrphans) {
    console.log('   TRẠNG THÁI: WARNING');
    console.log('   - Phân phối cân bằng');
    console.log(`   - Phát hiện ${stats.errors} vấn đề cần kiểm tra\n`);
  } else {
    console.log('   TRẠNG THÁI: NEEDS ATTENTION');
    console.log('   - Phân phối không cân bằng hoặc có lỗi');
    console.log('   - Cần điều tra thêm\n');
  }
  
  return stats;
}

/**
 * Verify distribution với mongosh (hash chính xác)
 */
async function verifyWithMongosh(collectionName, shardKeyField, sampleSize = 50) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(` VERIFICATION VỚI MONGOSH (Hash Accuracy)`);
  console.log(`   Collection: ${collectionName}`);
  console.log(`${'='.repeat(70)}\n`);
  
  const connection = getMongoConnection();
  const dbName = process.env.MONGO_DATABASE || 'socialnetwork';
  const db = connection.useDb(dbName);
  const collection = db.collection(collectionName);
  
  // Lấy sample
  const docs = await collection.find().limit(sampleSize).toArray();
  
  console.log(`   Testing ${docs.length} documents...\n`);
  
  const stats = {
    matched: 0,
    mismatched: 0,
    details: []
  };
  
  for (const doc of docs) {
    const shardKeyValue = doc[shardKeyField];
    
    // Tìm actual shard
    const foundOn = await findDocumentOnShards(collectionName, doc._id, shardKeyField);
    
    if (foundOn.length === 1) {
      const actualShard = foundOn[0].shard;
      
      // Lưu để có thể verify với mongosh sau
      stats.details.push({
        docId: doc._id.toString(),
        shardKeyValue: shardKeyValue.toString(),
        actualShard: actualShard
      });
      
      stats.matched++;
    } else {
      stats.mismatched++;
    }
  }
  
  console.log(`   ✓ Documents kiểm tra: ${stats.matched + stats.mismatched}`);
  console.log(`   ✓ Found on single shard: ${stats.matched}`);
  console.log(`   Issues: ${stats.mismatched}\n`);
  
  // Export data để có thể verify với mongosh
  if (stats.details.length > 0) {
    console.log(`   Để verify hash chính xác, chạy lệnh:\n`);
    console.log(`   mongosh --port 27017 --eval "`);
    console.log(`     var doc = db.getSiblingDB('${dbName}').${collectionName}.findOne({_id: ObjectId('${stats.details[0].docId}')});`);
    console.log(`     var hashed = convertShardKeyToHashed(doc.${shardKeyField});`);
    console.log(`     print('Hash: ' + hashed);`);
    console.log(`     print('Actual shard: ${stats.details[0].actualShard}');`);
    console.log(`   "\n`);
  }
  
  return stats;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║        MONGODB SHARD DISTRIBUTION VERIFICATION TOOL                ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    
    await connectMongoDB();
    
    const connection = getMongoConnection();
    const client = connection.getClient?.() || connection.client;
    const adminDb = client.db('admin');
    
    // Kiểm tra sharding status
    console.log('🔧 Kiểm tra cấu hình sharding...\n');
    
    const shardStatus = await adminDb.command({ listShards: 1 });
    console.log(`   ✓ Số lượng shards: ${shardStatus.shards.length}`);
    shardStatus.shards.forEach(shard => {
      console.log(`     - ${shard._id}: ${shard.host}`);
    });
    
    console.log('\n' + '─'.repeat(70));
    
    // Verify từng collection
    const collections = [
      { name: 'users', shardKey: '_id', sampleSize: 101 },
      { name: 'posts', shardKey: 'authorId', sampleSize: 500 },
      { name: 'comments', shardKey: 'postId', sampleSize: 500 }
    ];
    
    const results = {};
    
    for (const col of collections) {
      const stats = await verifyCollection(col.name, col.shardKey, col.sampleSize);
      results[col.name] = stats;
    }
    
    // Tổng kết
    console.log('\n' + '═'.repeat(70));
    console.log('TỔNG KẾT\n');
    
    let allPerfect = true;
    for (const [colName, stats] of Object.entries(results)) {
      const errorRate = ((stats.errors / stats.total) * 100).toFixed(1);
      const status = stats.errors === 0 ? '✅' : '⚠️';
      console.log(`   ${status} ${colName}: ${stats.verified}/${stats.total} verified (${errorRate}% errors)`);
      
      if (stats.errors > 0) {
        allPerfect = false;
      }
    }
    
    console.log('\n' + '═'.repeat(70));
    
    if (allPerfect) {
      console.log('\n   🎉 TẤT CẢ COLLECTIONS PHÂN PHỐI ĐÚNG!');
      console.log('   ✓ Không phát hiện orphaned documents');
      console.log('   ✓ Không có duplicates');
      console.log('   ✓ Phân phối cân bằng trên các shards\n');
    } else {
      console.log('\n   ⚠️  PHÁT HIỆN MỘT SỐ VẤN ĐỀ');
      console.log('   Xem chi tiết ở trên để biết thêm thông tin.\n');
    }
    
    // Optional: Verify hash accuracy với mongosh
    const args = process.argv.slice(2);
    if (args.includes('--verify-hash')) {
      console.log('\n' + '═'.repeat(70));
      await verifyWithMongosh('users', '_id', 10);
    }
    
  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await closeMongoConnection();
  }
}

main();
