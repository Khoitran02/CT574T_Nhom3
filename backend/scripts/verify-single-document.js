// ============================================================================
// SCRIPT VERIFY SHARD LOCATION CHO SINGLE DOCUMENT
// Sử dụng trong mongosh để kiểm tra document nằm trên shard nào
// ============================================================================

// Cấu hình
const DB_NAME = 'socialnetwork';
const CHUNK_RANGES = {
  shard3rs: { min: -Infinity, max: -3074457345618258602 },
  shard1rs: { min: -3074457345618258602, max: 3074457345618258602 },
  shard2rs: { min: 3074457345618258602, max: Infinity }
};

/**
 * HƯỚNG DẪN SỬ DỤNG:
 * 
 * 1. Chạy trong mongosh:
 *    mongosh --port 27017
 * 
 * 2. Load script:
 *    load('scripts/verify-single-document.js')
 * 
 * 3. Verify một user:
 *    verifyUserLocation(ObjectId("693afbe36156aa6f6edf2a94"))
 * 
 * 4. Verify một post:
 *    verifyPostLocation(ObjectId("693afbe62cbdecd1a694dbd4"))
 * 
 * 5. Verify một comment:
 *    verifyCommentLocation(ObjectId("693afbe62cbdecd1a694dc1e"))
 */

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
 * Verify location của một user
 */
function verifyUserLocation(userId) {
  print('\n' + '='.repeat(70));
  print('🔍 VERIFY USER LOCATION');
  print('='.repeat(70) + '\n');
  
  // 1. Lấy user document
  const user = db.getSiblingDB(DB_NAME).users.findOne({ _id: userId });
  
  if (!user) {
    print('❌ User không tồn tại!');
    return;
  }
  
  print('User ID: ' + userId);
  print('Username: ' + user.username);
  print('');
  
  // 2. Hash _id (shard key cho users)
  const hashed = convertShardKeyToHashed(userId);
  print('Hash value: ' + hashed);
  print('Hash value (Long): Long(\'' + hashed + '\')');
  print('');
  
  // 3. Predict shard
  const predicted = predictShard(hashed);
  print('📊 Chunk ranges:');
  print('  shard3rs: MinKey → Long(-3074457345618258602)');
  print('  shard1rs: Long(-3074457345618258602) → Long(3074457345618258602)');
  print('  shard2rs: Long(3074457345618258602) → MaxKey');
  print('');
  print('🎯 PREDICTED SHARD: ' + predicted);
  print('');
  
  // 4. Verify bằng explain()
  print('─'.repeat(70));
  print('🔍 ACTUAL SHARD (từ explain):');
  print('');
  
  const explain = db.getSiblingDB(DB_NAME).users.find({ _id: userId }).explain('allPlansExecution');
  
  let actualShard = null;
  
  if (explain.queryPlanner && explain.queryPlanner.winningPlan && explain.queryPlanner.winningPlan.shards) {
    const shards = explain.queryPlanner.winningPlan.shards;
    if (shards.length > 0) {
      actualShard = shards[0].shardName;
      print('✓ Shard: ' + actualShard);
      print('  Total shards queried: ' + shards.length);
    }
  }
  
  print('');
  print('─'.repeat(70));
  
  if (actualShard) {
    if (actualShard === predicted) {
      print('✅ KẾT QUẢ: KHỚP!');
      print('   Predicted: ' + predicted);
      print('   Actual: ' + actualShard);
    } else {
      print('❌ KẾT QUẢ: KHÔNG KHỚP!');
      print('   Predicted: ' + predicted);
      print('   Actual: ' + actualShard);
      print('   ⚠️  CÓ VẤN ĐỀ CẦN KIỂM TRA!');
    }
  } else {
    print('⚠️  Không xác định được shard từ explain');
    print('   (Thử connect trực tiếp vào shard để verify)');
  }
  
  print('\n');
}

/**
 * Verify location của một post
 */
function verifyPostLocation(postId) {
  print('\n' + '='.repeat(70));
  print('🔍 VERIFY POST LOCATION');
  print('='.repeat(70) + '\n');
  
  // 1. Lấy post document
  const post = db.getSiblingDB(DB_NAME).posts.findOne({ _id: postId });
  
  if (!post) {
    print('❌ Post không tồn tại!');
    return;
  }
  
  print('Post ID: ' + postId);
  print('Title: ' + post.title);
  print('Author ID: ' + post.authorId);
  print('');
  
  // 2. Hash authorId (shard key cho posts)
  const hashed = convertShardKeyToHashed(post.authorId);
  print('Shard key: authorId (hashed)');
  print('Hash value: ' + hashed);
  print('Hash value (Long): Long(\'' + hashed + '\')');
  print('');
  
  // 3. Predict shard
  const predicted = predictShard(hashed);
  print('🎯 PREDICTED SHARD: ' + predicted);
  print('');
  
  // 4. Verify bằng explain()
  print('─'.repeat(70));
  print('🔍 ACTUAL SHARD (từ explain):');
  print('');
  
  const explain = db.getSiblingDB(DB_NAME).posts.find({ _id: postId }).explain('allPlansExecution');
  
  let actualShard = null;
  
  if (explain.queryPlanner && explain.queryPlanner.winningPlan && explain.queryPlanner.winningPlan.shards) {
    const shards = explain.queryPlanner.winningPlan.shards;
    if (shards.length > 0) {
      actualShard = shards[0].shardName;
      print('✓ Shard: ' + actualShard);
    }
  }
  
  print('');
  print('─'.repeat(70));
  
  if (actualShard) {
    if (actualShard === predicted) {
      print('✅ KẾT QUẢ: KHỚP!');
    } else {
      print('❌ KẾT QUẢ: KHÔNG KHỚP!');
      print('   ⚠️  CÓ VẤN ĐỀ CẦN KIỂM TRA!');
    }
  }
  
  print('\n');
}

/**
 * Verify location của một comment
 */
function verifyCommentLocation(commentId) {
  print('\n' + '='.repeat(70));
  print('🔍 VERIFY COMMENT LOCATION');
  print('='.repeat(70) + '\n');
  
  const comment = db.getSiblingDB(DB_NAME).comments.findOne({ _id: commentId });
  
  if (!comment) {
    print('❌ Comment không tồn tại!');
    return;
  }
  
  print('Comment ID: ' + commentId);
  print('Post ID: ' + comment.postId);
  print('Content: ' + comment.content.substring(0, 50) + '...');
  print('');
  
  // Hash postId (shard key cho comments)
  const hashed = convertShardKeyToHashed(comment.postId);
  print('Shard key: postId (hashed)');
  print('Hash value: ' + hashed);
  print('');
  
  const predicted = predictShard(hashed);
  print('🎯 PREDICTED SHARD: ' + predicted);
  print('');
  
  // Verify bằng explain()
  print('─'.repeat(70));
  print('🔍 ACTUAL SHARD (từ explain):');
  print('');
  
  const explain = db.getSiblingDB(DB_NAME).comments.find({ _id: commentId }).explain('allPlansExecution');
  
  let actualShard = null;
  
  if (explain.queryPlanner && explain.queryPlanner.winningPlan && explain.queryPlanner.winningPlan.shards) {
    const shards = explain.queryPlanner.winningPlan.shards;
    if (shards.length > 0) {
      actualShard = shards[0].shardName;
      print('✓ Shard: ' + actualShard);
    }
  }
  
  print('');
  if (actualShard) {
    if (actualShard === predicted) {
      print('✅ KẾT QUẢ: KHỚP!');
    } else {
      print('❌ KẾT QUẢ: KHÔNG KHỚP!');
    }
  }
  
  print('\n');
}

/**
 * Test với random documents
 */
function testRandomDocuments(count = 5) {
  print('\n' + '═'.repeat(70));
  print('🎲 TESTING RANDOM DOCUMENTS');
  print('═'.repeat(70) + '\n');
  
  const users = db.getSiblingDB(DB_NAME).users.aggregate([
    { $sample: { size: count } }
  ]).toArray();
  
  let matched = 0;
  let total = users.length;
  
  users.forEach((user, idx) => {
    print(`\n[${idx + 1}/${total}] Testing user: ${user.username}`);
    
    const hashed = convertShardKeyToHashed(user._id);
    const predicted = predictShard(hashed);
    
    const explain = db.getSiblingDB(DB_NAME).users.find({ _id: user._id }).explain('allPlansExecution');
    
    let actualShard = null;
    if (explain.queryPlanner && explain.queryPlanner.winningPlan && explain.queryPlanner.winningPlan.shards) {
      actualShard = explain.queryPlanner.winningPlan.shards[0].shardName;
    }
    
    if (actualShard === predicted) {
      print(`  ✓ Predicted: ${predicted}, Actual: ${actualShard} → MATCH`);
      matched++;
    } else {
      print(`  ✗ Predicted: ${predicted}, Actual: ${actualShard} → MISMATCH!`);
    }
  });
  
  print('\n' + '─'.repeat(70));
  print(`📊 Kết quả: ${matched}/${total} khớp (${(matched/total*100).toFixed(1)}%)`);
  
  if (matched === total) {
    print('✅ TẤT CẢ ĐÚNG!');
  } else {
    print('⚠️  CÓ VẤN ĐỀ CẦN KIỂM TRA!');
  }
  
  print('\n');
}

// Export functions
print('✅ Script loaded successfully!');
print('');
print('📖 AVAILABLE FUNCTIONS:');
print('  - verifyUserLocation(ObjectId("..."))');
print('  - verifyPostLocation(ObjectId("..."))');
print('  - verifyCommentLocation(ObjectId("..."))');
print('  - testRandomDocuments(5)');
print('');
