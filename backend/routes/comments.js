import express from "express";
import Comment from "../models/comments.model.js";

const router = express.Router();

// Lấy comments của một post
router.get("/posts/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ 
      postId, 
      isVisible: true 
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

// Tạo comment mới cho post
router.post("/posts/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, author, userId } = req.body;

    const newComment = new Comment({
      content,
      author,
      postId,
      userId,
    });

    const savedComment = await newComment.save();

    res.status(201).json({
      message: "Tạo comment thành công",
      data: savedComment,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi tạo comment", 
      error: error.message 
    });
  }
});

// Lấy tất cả comments
router.get("/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ isVisible: true })
      .populate('postId', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Lấy tất cả comments thành công",
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

// Xóa comment
router.delete("/comments/:id", async (req, res) => {
  try {
    const deletedComment = await Comment.findByIdAndUpdate(
      req.params.id,
      { isVisible: false },
      { new: true }
    );

    if (!deletedComment) {
      return res.status(404).json({
        message: "Comment không tồn tại",
      });
    }

    res.status(200).json({
      message: "Xóa comment thành công",
      data: deletedComment,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi xóa comment", 
      error: error.message 
    });
  }
});

export default router;