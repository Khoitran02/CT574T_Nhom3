import express from "express";
import Comment from "../models/comments.model.js";

const router = express.Router();

// Lấy tất cả comments - GET /api/comments
router.get("/", async (req, res) => {
  try {
    const comments = await Comment.find({ isVisible: true })
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

// Xóa comment - DELETE /api/comments/:id
router.delete("/:id", async (req, res) => {
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