// test-mongodb.js
// Script để test kết nối MongoDB Cluster
import { connectMongoDB, getMongoConnection, closeMongoConnection, testMongoConnection } from './config/mongodb.js';

async function testMongoDBConnection() {
  try {
    console.log('🔄 Đang test kết nối MongoDB Cluster...\n');
    
    // Kết nối MongoDB
    const connection = await connectMongoDB();
    
    // Wait for connection to be fully ready
    if (connection.readyState !== 1) {
      console.log('⏳ Waiting for connection to be ready...');
      await new Promise(resolve => {
        if (connection.readyState === 1) resolve();
        else connection.once('connected', resolve);
      });
    }
    
    console.log('1. Test connection ping...');
    // Use connection safely - get native db object
    let adminDb, db;
    try {
      // Try to get admin database through Mongoose connection
      if (connection.db) {
        adminDb = connection.db.admin();
        db = connection.useDb('socialnetwork');
      } else {
        // Fallback: use connection.client if available  
        const client = connection.getClient?.() || connection.client;
        adminDb = client.db('admin');
        db = client.db('socialnetwork');
      }
      
      const pingResult = await adminDb.ping();
      console.log('✅', pingResult.ok === 1 ? 'MongoDB connection successful!' : 'Ping failed');
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      throw error;
    }
    
    // Test sharding status  
    console.log('\n2. Test sharding status...');
    try {
      const shardStatus = await adminDb.command({ listShards: 1 });
      console.log('✅ Sharding enabled with', shardStatus.shards.length, 'shards:');
      shardStatus.shards.forEach(shard => {
        console.log(`   - ${shard._id}: ${shard.host}`);
      });
    } catch (error) {
      console.log('⚠️  Sharding not available (single MongoDB instance):', error.message);
    }
    
    // Test database access (db already declared above)
    console.log('\n3. Test database operations...');
    
    // Test insert và query
    const testCollection = db.collection('test_connection');
    const testDoc = { 
      test_id: 'connection-test', 
      timestamp: new Date(),
      message: 'MongoDB cluster connection test'
    };
    
    await testCollection.insertOne(testDoc);
    console.log('✅ Test document inserted');
    
    const found = await testCollection.findOne({ test_id: 'connection-test' });
    if (found) {
      console.log('✅ Test document retrieved:', found.message);
    }
    
    // Test collection sharding status (if available)
    console.log('\n4. Test collection sharding...');
    try {
      const collections = ['users', 'posts', 'comments'];
      for (const collName of collections) {
        try {
          const shardInfo = await db.runCommand({ getShardDistribution: collName });
          console.log(`✅ Collection '${collName}' is sharded`);
        } catch (err) {
          if (err.code === 26) {
            console.log(`⚠️  Collection '${collName}' not found (will be created when first used)`);
          } else {
            console.log(`ℹ️  Collection '${collName}' not sharded yet`);
          }
        }
      }
    } catch (error) {
      console.log('ℹ️  Sharding commands not available');
    }
    
    // Test write concern and read preference
    console.log('\n5. Test cluster configuration...');
    const serverStatus = await adminDb.command({ serverStatus: 1 });
    console.log('✅ Server:', serverStatus.process, 'version', serverStatus.version);
    
    if (serverStatus.sharding) {
      console.log('✅ Mongos router detected - cluster setup correct');
    } else {
      console.log('ℹ️  Direct mongod connection - not cluster setup');
    }
    
    // Cleanup test document
    console.log('\n6. Cleanup test data...');
    await testCollection.deleteOne({ test_id: 'connection-test' });
    console.log('✅ Test document cleaned up');
    
    console.log('\n🎉 Test kết nối MongoDB Cluster hoàn tất thành công!');
    
    // Summary
    console.log('\n📊 Connection Summary:');
    console.log('   MongoDB URI: mongodb://localhost:27017/socialnetwork');
    console.log('   Database: socialnetwork');
    console.log('   Connection type:', serverStatus.sharding ? 'Sharded Cluster (mongos)' : 'Single Instance');
    
  } catch (error) {
    console.error('❌ Test kết nối MongoDB thất bại:');
    console.error('Error:', error.message);
    
    // Gợi ý khắc phục
    console.log('\n💡 Gợi ý khắc phục:');
    console.log('- Kiểm tra MongoDB cluster đã khởi động chưa:');
    console.log('  Get-Process mongod,mongos -ErrorAction SilentlyContinue');
    console.log('- Kiểm tra port 27017 có sẵn:');
    console.log('  mongosh --port 27017 --eval "db.runCommand(\'ping\')"');
    console.log('- Khởi động cluster nếu chưa chạy:');
    console.log('  .\\script\\start-mongodb-cluster.ps1');
    console.log('- Kiểm tra log files:');
    console.log('  Get-Content C:\\MongoDB-Dev\\logs\\mongos.log -Tail 10');
    
  } finally {
    await closeMongoConnection();
  }
}

// Chạy test
testMongoDBConnection().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});