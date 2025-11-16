import express from "express";
import bcrypt from "bcrypt";
import User from "../models/users.model.js";
import logger from "../config/logger.js";

const router = express.Router();

// Tạo admin user mặc định - POST /api/seed/admin
router.post("/admin", async (req, res) => {
  try {
    // Kiểm tra xem đã có admin chưa
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      return res.status(400).json({
        message: "Admin user đã tồn tại",
        data: {
          username: existingAdmin.username,
          email: existingAdmin.email,
        },
      });
    }

    // Tạo admin mặc định
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const adminUser = new User({
      username: "admin",
      email: "admin@socialnetwork.com",
      password: hashedPassword,
      name: "Administrator",
      bio: "System Administrator",
      role: "admin",
    });

    const savedAdmin = await adminUser.save();

    // Không trả về password
    const adminResponse = savedAdmin.toObject();
    delete adminResponse.password;

    res.status(201).json({
      message: "Tạo admin user thành công",
      data: adminResponse,
      credentials: {
        username: "admin",
        password: "admin123",
        note: "Vui lòng đổi password sau khi đăng nhập lần đầu",
      },
    });
  } catch (error) {
    logger.error("Error creating admin:", error);
    res.status(500).json({
      message: "Lỗi khi tạo admin user",
      error: error.message,
    });
  }
});

export default router;
