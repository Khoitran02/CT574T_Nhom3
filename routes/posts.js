import express from "express";
import Post from "../models/posts.model.js";

const Post_router = express.Router();

Post_router.get("/", async (req, res) => {
  try {
    const posts = await Post.find();

    const data = posts.map((post) => ({
      id: post._id,
      title: post.title,
      content: post.content,
      author: post.author,
      createdAt: post.createdAt,
    }));

    res.status(200).json({
      message: "Lấy dữ liệu bài viết thành công",
      data,
      total: posts.length,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy dữ liệu",
      error: err.message,
    });
  }
});

export default Post_router;
