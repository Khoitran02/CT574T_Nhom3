import express from "express";
import Post from "../models/posts.model.js";
import { getNeo4jDriver } from "../config/database.js";
import Comment from "../models/comments.model.js";
const router = express.Router();

// Lấy tất cả posts
router.get("/", async (req, res) => {
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
      data: data,
      total: posts.length,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy dữ liệu",
      error: err.message,
    });
  }
});

// Tạo post mới
router.post("/", async (req, res) => {
  try {
    const newPost = new Post(req.body);
    const savedPost = await newPost.save();

    // Tạo quan hệ trong Neo4j nếu có userId
    if (req.body.authorId) {
      const driver = getNeo4jDriver();
      const session = driver.session();

      await session.run(
        `MATCH (u:User {id: $authorId}) 
         CREATE (u)-[:CREATED {at: datetime()}]->(p:Post {id: $postId, title: $title})`,
        {
          authorId: req.body.authorId,
          postId: savedPost._id.toString(),
          title: savedPost.title,
        }
      );
      await session.close();
    }

    res.status(201).json({
      message: "Tạo bài viết thành công",
      data: savedPost,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Lấy comments của một post - GET /api/posts/:postId/comments
router.get("/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({
      postId,
      isVisible: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Lấy comments thành công",
      data: comments,
      total: comments.length,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy comments",
      error: err.message,
    });
  }
});

export default router;
