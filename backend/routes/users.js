import express from "express";
import User from "../models/users.model.js";
import { getNeo4jSession } from "../config/database.js";
import { upload } from "../config/upload.js";
import logger from "../config/logger.js";

const router = express.Router();

// Lấy tất cả users với phân trang
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const total = await User.countDocuments({ isActive: true });
    const users = await User.find({ isActive: true })
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      message: "Lấy danh sách users thành công",
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
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
    const { username, email, name, bio, avatar, role } = req.body;
    
    logger.info('Creating user:', { username, email, name, role });
    
    // Kiểm tra user đã tồn tại
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      logger.warn('User already exists:', existingUser.username);
      return res.status(400).json({
        message: "Username hoặc email đã tồn tại",
      });
    }

    const newUser = new User({ username, email, name, bio, avatar, role: role || 'user' });
    const savedUser = await newUser.save();
    
    logger.info('User saved to MongoDB:', savedUser._id.toString());

    // Tạo user node trong Neo4j (chỉ cho role user)
    if (savedUser.role === 'user') {
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
        logger.info('User created in Neo4j');
      } catch (neo4jError) {
        logger.warn('⚠️ Neo4j user creation failed:', neo4jError.message);
      }
    }

    res.status(201).json({
      message: "Tạo user thành công",
      data: savedUser,
    });
  } catch (error) {
    logger.error('Error creating user:', error);
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
      logger.warn('⚠️ Neo4j user update failed:', neo4jError.message);
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

// Cập nhật avatar và tạo post - PATCH /users/:id/avatar
router.patch("/:id/avatar", upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Không có file được upload",
      });
    }

    const avatarUrl = `/uploads/user-images/${req.file.filename}`;
    
    // Cập nhật avatar trong MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!updatedUser) {
      return res.status(404).json({
        message: "User không tồn tại",
      });
    }

    // Tạo post về việc cập nhật avatar
    const Post = (await import('../models/posts.model.js')).default;
    const newPost = await Post.create({
      title: "Đã cập nhật ảnh đại diện",
      content: `${updatedUser.name} đã cập nhật ảnh đại diện mới`,
      author: updatedUser.name,
      authorId: updatedUser._id,
      images: [avatarUrl],
      tags: ['avatar_update'],
      isPublished: true,
    });

    logger.info(`✅ User avatar updated and post created: ${updatedUser._id}`);

    res.status(200).json({
      message: "Cập nhật avatar thành công",
      data: {
        user: updatedUser,
        post: newPost,
      },
    });
  } catch (error) {
    logger.error("❌ Update avatar error:", error);
    res.status(500).json({
      message: "Lỗi khi cập nhật avatar",
      error: error.message,
    });
  }
});

// Cập nhật user (PATCH - partial update)
router.patch("/:id", async (req, res) => {
  try {
    const { name, email, bio, avatar } = req.body;
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!updatedUser) {
      return res.status(404).json({
        message: "User không tồn tại",
      });
    }

    // Cập nhật Neo4j (chỉ cho role user)
    if (updatedUser.role === 'user') {
      try {
        const session = getNeo4jSession();
        
        await session.run(
          `MATCH (u:User {id: $id})
           SET u.name = $name,
               u.email = $email,
               u.updated = datetime()`,
          {
            id: updatedUser._id.toString(),
            name: updatedUser.name,
            email: updatedUser.email,
          }
        );
        
        await session.close();
      } catch (neo4jError) {
        logger.warn('⚠️ Neo4j user update failed:', neo4jError.message);
      }
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