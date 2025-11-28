import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { connectMongoDB, closeMongoConnection } from '../config/mongodb.js';
import User from '../models/users.model.js';

dotenv.config();

async function seedAdminUser() {
  try {
    // Kiểm tra admin đã tồn tại
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      console.log(' Admin user đã tồn tại');
      console.log(` Username: ${existingAdmin.username}`);
      console.log(` Email: ${existingAdmin.email}`);
      return;
    }

    // Tạo admin mới
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = new User({
      username: 'admin',
      email: 'admin@socialnetwork.com',
      password: hashedPassword,
      name: 'Administrator',
      bio: 'System Administrator',
      role: 'admin',
    });

    await adminUser.save();

    console.log(' Đã tạo admin user');
    console.log(' Username: admin');
    console.log(' Password: admin123');
    console.log(' Email: admin@socialnetwork.com');
  } catch (error) {
    console.error(' Lỗi khi tạo admin:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await connectMongoDB();
    console.log('\n Seeding database...\n');
    
    await seedAdminUser();
    
    console.log('\n Seed hoàn tất!\n');
  } catch (error) {
    console.error(' Seed thất bại:', error.message);
    process.exit(1);
  } finally {
    await closeMongoConnection();
  }
}

main();
