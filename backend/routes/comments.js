import express from "express";
import Comment from "../models/comments.model.js";
import { upload } from "../config/upload.js";

const router = express.Router();

// Lấy tất cả comments với phân trang - GET /api/comments
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const total = await Comment.countDocuments({ isVisible: true });
    const comments = await Comment.find({ isVisible: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      message: "Lấy tất cả comments thành công",
      data: comments,
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
      message: "Lỗi khi lấy comments",
      error: err.message,
    });
  }
});

// Lấy comments của một post - GET /api/comments/post/:postId
router.get("/post/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Lấy tất cả comments và replies với thông tin author
    const allComments = await Comment.find({ 
      postId, 
      isVisible: true 
    })
    .populate('authorId', 'avatar name username')
    .sort({ createdAt: 1 });

    // Tổ chức thành cấu trúc tree
    const commentMap = {};
    const rootComments = [];

    allComments.forEach(comment => {
      const commentObj = comment.toObject();
      commentMap[comment._id] = {
        ...commentObj,
        authorAvatar: comment.authorId?.avatar || '',
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

// Tạo comment mới với hỗ trợ upload ảnh - POST /api/comments
router.post("/", upload.array('images', 3), async (req, res) => {
  try {
    const { content, author, authorId, postId, parentCommentId } = req.body;

    if (!content || !author || !authorId || !postId) {
      return res.status(400).json({
        message: "content, author, authorId và postId là bắt buộc",
      });
    }

    // Xử lý uploaded images
    const imagePaths = req.files ? req.files.map(file => `/uploads/user-images/${file.filename}`) : [];

    // Parse mentions và emojis từ JSON string nếu có
    const mentions = req.body.mentions ? JSON.parse(req.body.mentions) : [];
    const emojis = req.body.emojis ? JSON.parse(req.body.emojis) : [];

    const newComment = new Comment({
      content,
      author,
      authorId,
      postId,
      parentCommentId: parentCommentId || null,
      images: imagePaths,
      mentions: mentions,
      emojis: emojis,
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

// Cập nhật comment - PUT /api/comments/:id
router.put("/:id", upload.array('images', 3), async (req, res) => {
  try {
    const { content, mentions, emojis } = req.body;

    if (!content) {
      return res.status(400).json({
        message: "content là bắt buộc",
      });
    }

    const updateData = {
      content,
      isEdited: true,
      editedAt: new Date(),
    };

    // Parse mentions và emojis từ JSON string nếu có
    if (mentions) {
      updateData.mentions = JSON.parse(mentions);
    }
    if (emojis) {
      updateData.emojis = JSON.parse(emojis);
    }

    // Xử lý uploaded images nếu có
    if (req.files && req.files.length > 0) {
      const imagePaths = req.files.map(file => `/uploads/user-images/${file.filename}`);
      updateData.images = imagePaths;
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedComment) {
      return res.status(404).json({
        message: "Comment không tồn tại",
      });
    }

    res.status(200).json({
      message: "Cập nhật comment thành công",
      data: updatedComment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi cập nhật comment",
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