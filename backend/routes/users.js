import express from "express";
import User from "../models/users.model.js";
import { getNeo4jSession } from "../config/database.js";

const router = express.Router();

// Lấy tất cả users
router.get("/", async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('-__v').sort({ createdAt: -1 });
    
    res.status(200).json({
      message: "Lấy danh sách users thành công",
      data: users,
      total: users.length,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy dữ liệu users",
      error: err.message,
    });
  }
});

// Tạo user mới
router.post("/", async (req, res) => {
  try {
    const { username, email, name, bio, avatar } = req.body;
    
    console.log('Creating user:', { username, email, name });
    
    // Kiểm tra user đã tồn tại
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      console.log('User already exists:', existingUser.username);
      return res.status(400).json({
        message: "Username hoặc email đã tồn tại",
      });
    }

    const newUser = new User({ username, email, name, bio, avatar });
    const savedUser = await newUser.save();
    
    console.log('User saved to MongoDB:', savedUser._id);

    // Tạo user node trong Neo4j
    try {
      const session = getNeo4jSession();
      
      await session.run(
        `CREATE (u:User {
          id: $id,
          username: $username,
          email: $email,
          name: $name,
          created: datetime()
        })`,
        {
          id: savedUser._id.toString(),
          username: savedUser.username,
          email: savedUser.email,
          name: savedUser.name,
        }
      );
      
      await session.close();
      console.log('User created in Neo4j');
    } catch (neo4jError) {
      console.warn('⚠️ Neo4j user creation failed:', neo4jError.message);
    }

    res.status(201).json({
      message: "Tạo user thành công",
      data: savedUser,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      message: "Lỗi khi tạo user", 
      error: error.message 
    });
  }
});

// Lấy user theo ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    
    if (!user) {
      return res.status(404).json({
        message: "User không tồn tại",
      });
    }

    res.status(200).json({
      message: "Lấy thông tin user thành công",
      data: user,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi lấy thông tin user", 
      error: error.message 
    });
  }
});

// Cập nhật user
router.put("/:id", async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, bio, avatar },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updatedUser) {
      return res.status(404).json({
        message: "User không tồn tại",
      });
    }

    // Cập nhật Neo4j
    try {
      const session = getNeo4jSession();
      
      await session.run(
        `MATCH (u:User {id: $id})
         SET u.name = $name
         SET u.updated = datetime()`,
        {
          id: updatedUser._id.toString(),
          name: updatedUser.name,
        }
      );
      
      await session.close();
    } catch (neo4jError) {
      console.warn('⚠️ Neo4j user update failed:', neo4jError.message);
    }

    res.status(200).json({
      message: "Cập nhật user thành công",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi cập nhật user", 
      error: error.message 
    });
  }
});

// Xóa user (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!deletedUser) {
      return res.status(404).json({
        message: "User không tồn tại",
      });
    }

    res.status(200).json({
      message: "Xóa user thành công",
      data: deletedUser,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi xóa user", 
      error: error.message 
    });
  }
});

export default router;