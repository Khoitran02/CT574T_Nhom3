import mongoose from 'mongoose';
import { connectMongoDB } from '../config/mongodb.js';
import User from '../models/users.model.js';
import logger from '../config/logger.js';

const createTestUser = async () => {
  try {
    // Kết nối MongoDB
    await connectMongoDB();
    logger.info('Connected to MongoDB');

    // Tạo user test với dữ liệu ngẫu nhiên
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000);
    
    const testUser = await User.create({
      name: `Test User ${randomNum}`,
      username: `testuser${timestamp}`,
      email: `testuser${timestamp}@test.com`,
      password: 'test123456', // Sẽ được hash tự động bởi pre-save hook
      bio: `Bio của test user ${randomNum}`,
      role: 'user',
    });

    logger.info('✅ Test user created successfully!');
    console.log('\n=== TEST USER INFO ===');
    console.log(`ID: ${testUser._id}`);
    console.log(`Name: ${testUser.name}`);
    console.log(`Username: ${testUser.username}`);
    console.log(`Email: ${testUser.email}`);
    console.log(`Role: ${testUser.role}`);
    console.log('=====================\n');

    // Đóng kết nối
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error creating test user:', error);
    process.exit(1);
  }
};

createTestUser();
