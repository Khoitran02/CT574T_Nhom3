import express from "express";
import bcrypt from "bcrypt";
import User from "../models/users.model.js";
import { getNeo4jSession } from "../config/neo4j.js";
import logger from "../config/logger.js";

const router = express.Router();

// Register - POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, name, bio, avatar } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({
        message: "Username, email, password và name là bắt buộc",
      });
    }

    // Kiểm tra user đã tồn tại
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username hoặc email đã tồn tại",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      name,
      bio: bio || "",
      avatar: avatar || "",
      role: "user", // Mặc định là user
    });

    const savedUser = await newUser.save();

    // Tạo user node trong Neo4j (chỉ cho role user, không tạo cho admin)
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
      } catch (neo4jError) {
        logger.warn("⚠️ Neo4j user creation failed:", neo4jError.message);
      }
    }

    // Không trả về password
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: "Đăng ký thành công",
      data: userResponse,
    });
  } catch (error) {
    logger.error("Error in register:", error);
    res.status(500).json({
      message: "Lỗi khi đăng ký",
      error: error.message,
    });
  }
});

// Login - POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username và password là bắt buộc",
      });
    }

    // Tìm user
    const user = await User.findOne({ username, isActive: true });

    if (!user) {
      return res.status(401).json({
        message: "Username hoặc password không đúng",
      });
    }

    // Kiểm tra password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Username hoặc password không đúng",
      });
    }

    // Không trả về password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: "Đăng nhập thành công",
      data: userResponse,
    });
  } catch (error) {
    logger.error("Error in login:", error);
    res.status(500).json({
      message: "Lỗi khi đăng nhập",
      error: error.message,
    });
  }
});

// Get current user - GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    // Simple implementation - in real app, would use JWT token
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        message: "Chưa đăng nhập",
      });
    }

    const user = await User.findById(userId).select("-password");

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
      error: error.message,
    });
  }
});

// Change password - POST /api/auth/change-password
router.post("/change-password", async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({
        message: "userId, currentPassword và newPassword là bắt buộc",
      });
    }

    // Tìm user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User không tồn tại",
      });
    }

    // Kiểm tra password hiện tại
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Mật khẩu hiện tại không đúng",
      });
    }

    // Hash password mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    logger.error("Error in change-password:", error);
    res.status(500).json({
      message: "Lỗi khi đổi mật khẩu",
      error: error.message,
    });
  }
});

export default router;
