// test-all-databases.js
// Script để test kết nối tất cả databases
import { connectAllDatabases, testAllConnections, closeAllConnections } from './config/database.js';

async function testAllDatabaseConnections() {
  try {
    console.log('🚀 Social Network Database Connection Test');
    console.log('==========================================\n');
    
    // Kết nối tất cả databases
    const connectionResults = await connectAllDatabases();
    
    // Đợi một chút để connections ổn định
    console.log('\n⏳ Waiting for connections to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test tất cả connections
    const testResults = await testAllConnections();
    
    // Hiển thị kết quả chi tiết
    console.log('\n📋 Detailed Results:');
    testResults.forEach(result => {
      console.log(`\n${result.database}:`);
      console.log(`   Status: ${result.status}`);
      if (result.uri) console.log(`   URI: ${result.uri}`);
      if (result.type) console.log(`   Type: ${result.type}`);
      if (result.shards !== undefined) console.log(`   Shards: ${result.shards}`);
      if (result.message) console.log(`   Message: ${result.message}`);
      if (result.error) console.log(`   Error: ${result.error}`);
    });
    
    // Đánh giá tổng thể
    const successfulConnections = testResults.filter(r => r.status === 'connected');
    const failedConnections = testResults.filter(r => r.status === 'failed');
    
    console.log('\n🎯 Final Assessment:');
    console.log(`   ✅ Successful: ${successfulConnections.length}/${testResults.length} databases`);
    
    if (failedConnections.length > 0) {
      console.log(`   ❌ Failed: ${failedConnections.length} databases`);
      console.log('\n💡 Troubleshooting suggestions:');
      
      failedConnections.forEach(failed => {
        if (failed.database === 'MongoDB') {
          console.log('   MongoDB:');
          console.log('   - Check if MongoDB cluster is running: Get-Process mongod,mongos');
          console.log('   - Start cluster: .\\script\\start-mongodb-cluster.ps1');
          console.log('   - Check port 27017: mongosh --port 27017 --eval "db.runCommand(\'ping\')"');
        }
        
        if (failed.database === 'Neo4j') {
          console.log('   Neo4j:');
          console.log('   - Check if Neo4j Desktop is running');
          console.log('   - Verify database "socialnetwork" is started');
          console.log('   - Check port 7687 is accessible');
          console.log('   - Verify credentials: neo4j/password123');
        }
      });
    } else {
      console.log('\n🎉 All databases are ready for the Social Network application!');
      console.log('\nNext steps:');
      console.log('   1. Start web application: npm start');
      console.log('   2. Access app at: http://localhost:3000');
      console.log('   3. Neo4j Browser: http://localhost:7474');
    }
    
  } catch (error) {
    console.error('\n❌ Database test failed unexpectedly:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    console.log('\n🔄 Cleaning up connections...');
    await closeAllConnections();
    console.log('✅ Test completed');
  }
}

// Chạy test
testAllDatabaseConnections().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Critical error:', error);
  process.exit(1);
});