// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json()); // cho phép đọc JSON từ body

// Kết nối MongoDB
mongoose
  .connect(process.env.MONGO_URI_POSTS)
  .then(() => console.log("Kết nối MongoDB thành công"))
  .catch((err) => console.error("Lỗi kết nối MongoDB:", err));

// Route mẫu
app.get("/", (req, res) => {
  res.send("Hello from Express + MongoDB!");
});

// Import model mẫu
import Post from "./models/posts.model.js";

// Route thêm post mới
app.post("/posts", async (req, res) => {
  try {
    const newPost = new Post(req.body);
    const save_post = await newPost.save();
    res.json(save_post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route lấy tất cả posts
app.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find();
    const data = posts.map((post) => ({
      id: post._id,
      name: post.name,
      email: post.email,
    }));
    res.status(200).json({
      message: "Lấy dữ liệu bài viết thành công",
      data: data,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy dữ liệu",
      error: err.message,
    });
  }
});

// Route xóa post theo ID
app.delete("/posts/:id", async (req, res) => {
  try {
    const deleted = await Post.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }
    res.json({ message: "Xóa bài viết thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`--Server chạy tại ${PORT}`));
