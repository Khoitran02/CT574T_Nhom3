import express from "express";
import Comment from "../models/comments.model.js";
import { withFailover, handleShardError } from "../config/failover.js";

const router = express.Router();

// Lấy tất cả comments - GET /api/comments
router.get("/", async (req, res) => {
  try {
    const comments = await withFailover(
      Comment.find({ isVisible: true }).sort({ createdAt: -1 })
    );

    res.status(200).json({
      message: "Lấy tất cả comments thành công",
      data: comments,
      total: comments.length,
    });
  } catch (err) {
    return handleShardError(err, res, 'lấy comments');
  }
});

// Lấy comments của một post - GET /api/comments/post/:postId
router.get("/post/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Lấy tất cả comments và replies
    const allComments = await withFailover(
      Comment.find({ postId, isVisible: true }).sort({ createdAt: 1 })
    );

    // Tổ chức thành cấu trúc tree
    const commentMap = {};
    const rootComments = [];

    allComments.forEach(comment => {
      commentMap[comment._id] = {
        ...comment.toObject(),
        replies: []
      };
    });

    allComments.forEach(comment => {
      if (comment.parentCommentId) {
        if (commentMap[comment.parentCommentId]) {
          commentMap[comment.parentCommentId].replies.push(commentMap[comment._id]);
        }
      } else {
        rootComments.push(commentMap[comment._id]);
      }
    });

    res.status(200).json({
      message: "Lấy comments thành công",
      data: rootComments,
      total: rootComments.length,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy comments",
      error: err.message,
    });
  }
});

// Tạo comment mới - POST /api/comments
router.post("/", async (req, res) => {
  try {
    const { content, author, authorId, postId, parentCommentId } = req.body;

    if (!content || !author || !authorId || !postId) {
      return res.status(400).json({
        message: "content, author, authorId và postId là bắt buộc",
      });
    }

    const newComment = new Comment({
      content,
      author,
      authorId,
      postId,
      parentCommentId: parentCommentId || null,
    });

    const savedComment = await newComment.save();

    res.status(201).json({
      message: "Tạo comment thành công",
      data: savedComment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi tạo comment",
      error: error.message,
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

// Like/Unlike comment - POST /api/comments/:id/like
router.post("/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId là bắt buộc",
      });
    }

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        message: "Comment không tồn tại",
      });
    }

    const alreadyLiked = comment.likedBy.includes(userId);

    if (alreadyLiked) {
      // Unlike
      comment.likedBy = comment.likedBy.filter((id) => id.toString() !== userId);
      comment.likes = Math.max(0, comment.likes - 1);
    } else {
      // Like
      comment.likedBy.push(userId);
      comment.likes += 1;
    }

    await comment.save();

    res.status(200).json({
      message: alreadyLiked ? "Bỏ thích comment thành công" : "Thích comment thành công",
      data: {
        likes: comment.likes,
        isLiked: !alreadyLiked,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi like comment",
      error: error.message,
    });
  }
});

export default router;