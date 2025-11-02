// test-neo4j.js
// Script để test kết nối Neo4j
import { connectNeo4j, getNeo4jSession, closeNeo4jConnection, testNeo4jConnection } from './config/neo4j.js';

async function testNeo4jConnection() {
  try {
    console.log('🔄 Đang test kết nối Neo4j...\n');
    
    // Kết nối Neo4j
    await connectNeo4j();
    
    // Tạo session và test
    const session = getNeo4jSession();
    
    // Test query đơn giản
    console.log('1. Test query cơ bản...');
    const result1 = await session.run('RETURN "Neo4j connection successful!" AS message, datetime() AS timestamp');
    console.log('✅', result1.records[0].get('message'));
    console.log('   Timestamp:', result1.records[0].get('timestamp').toString());
    
    // Test tạo node
    console.log('\n2. Test tạo node...');
    await session.run(`
      MERGE (test:TestNode {id: 'test-connection', created: datetime()})
      SET test.lastChecked = datetime()
      RETURN test
    `);
    console.log('✅ Test node đã được tạo/cập nhật');
    
    // Test query node
    console.log('\n3. Test query node...');
    const result2 = await session.run('MATCH (test:TestNode {id: "test-connection"}) RETURN test');
    if (result2.records.length > 0) {
      console.log('✅ Test node tìm thấy:', result2.records[0].get('test').properties);
    }
    
    // Xóa test node
    console.log('\n4. Dọn dẹp test node...');
    await session.run('MATCH (test:TestNode {id: "test-connection"}) DELETE test');
    console.log('✅ Test node đã được xóa');
    
    await session.close();
    console.log('\n🎉 Test kết nối Neo4j hoàn tất thành công!');
    
  } catch (error) {
    console.error('❌ Test kết nối Neo4j thất bại:');
    console.error('Error:', error.message);
    
    if (error.code) {
      console.error('Code:', error.code);
    }
    
    // Gợi ý khắc phục
    console.log('\n💡 Gợi ý khắc phục:');
    console.log('- Kiểm tra Neo4j Desktop đã khởi động chưa');
    console.log('- Kiểm tra database "socialnetwork" đã được tạo và started');
    console.log('- Kiểm tra username/password trong .env hoặc Neo4j Desktop');
    console.log('- Kiểm tra port 7687 không bị chiếm dụng');
    
  } finally {
    await closeNeo4jConnection();
  }
}

// Chạy test
testNeo4jConnection().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});