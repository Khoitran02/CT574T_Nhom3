import express from "express";
import Post from "../models/posts.model.js";
import Comment from "../models/comments.model.js";
import { getNeo4jSession } from "../config/database.js";
import { upload } from "../config/upload.js";

const router = express.Router();

// Lấy tất cả posts với phân trang và bộ lọc
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter query
    const filter = {};
    
    // Filter by author name (case-insensitive partial match)
    if (req.query.author) {
      filter.author = { $regex: req.query.author, $options: 'i' };
    }
    
    // Filter by date range
    if (req.query.fromDate || req.query.toDate) {
      filter.createdAt = {};
      if (req.query.fromDate) {
        filter.createdAt.$gte = new Date(req.query.fromDate);
      }
      if (req.query.toDate) {
        // Add 1 day to include the entire toDate
        const toDate = new Date(req.query.toDate);
        toDate.setDate(toDate.getDate() + 1);
        filter.createdAt.$lt = toDate;
      }
    }
    
    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const data = posts.map((post) => ({
      id: post._id.toString(),
      content: post.content,
      author: post.author,
      userId: post.authorId?.toString(),
      createdAt: post.createdAt,
      likes: post.likes || 0,
      likedBy: post.likedBy?.map(id => id.toString()) || [],
      images: post.images || [],
      mentions: post.mentions || [],
      emojis: post.emojis || [],
    }));

    res.status(200).json({
      message: "Lấy dữ liệu bài viết thành công",
      data: data,
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
      message: "Lỗi khi lấy dữ liệu",
      error: err.message,
    });
  }
});

// Tạo post mới với hỗ trợ upload ảnh
router.post("/", upload.array('images', 5), async (req, res) => {
  try {
    // Kiểm tra nếu là admin thì không cho tạo post
    if (req.body.userId) {
      const User = (await import('../models/users.model.js')).default;
      const user = await User.findById(req.body.userId);
      if (user && user.role === 'admin') {
        return res.status(403).json({
          message: "Admin không được tạo post. Chỉ user mới có thể tạo post.",
        });
      }
    }

    // Xử lý uploaded images
    const imagePaths = req.files ? req.files.map(file => `/uploads/user-images/${file.filename}`) : [];

    // Parse mentions và emojis từ JSON string nếu có
    const mentions = req.body.mentions ? JSON.parse(req.body.mentions) : [];
    const emojis = req.body.emojis ? JSON.parse(req.body.emojis) : [];

    // Map userId từ request thành authorId cho model
    const postData = {
      content: req.body.content,
      author: req.body.author,
      authorId: req.body.userId,
      tags: req.body.tags || [],
      images: imagePaths,
      mentions: mentions,
      emojis: emojis,
      isPublished: req.body.isPublished !== undefined ? req.body.isPublished : true,
    };

    const newPost = new Post(postData);
    const savedPost = await newPost.save();

    // Tạo quan hệ trong Neo4j nếu có userId
    if (req.body.userId) {
      const session = getNeo4jSession();

      await session.run(
        `MATCH (u:User {id: $userId}) 
         CREATE (u)-[:CREATED {at: datetime()}]->(p:Post {id: $postId})`,
        {
          userId: req.body.userId,
          postId: savedPost._id.toString(),
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

// Lấy comments của một post với phân trang - GET /api/posts/:postId/comments
router.get("/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const total = await Comment.countDocuments({ postId, isVisible: true });
    const comments = await Comment.find({ 
      postId, 
      isVisible: true 
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    res.status(200).json({
      message: "Lấy comments thành công",
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

// Tạo comment mới cho post - POST /api/posts/:postId/comments
router.post("/:postId/comments", async (req, res) => {
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

// Like post - POST /api/posts/:postId/like
router.post("/:postId/like", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId là bắt buộc" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post không tồn tại" });
    }

    // Kiểm tra đã like chưa
    const alreadyLiked = post.likedBy?.includes(userId);
    
    if (alreadyLiked) {
      // Unlike
      post.likedBy = post.likedBy.filter(id => id.toString() !== userId);
      post.likes = Math.max(0, (post.likes || 0) - 1);
    } else {
      // Like
      if (!post.likedBy) post.likedBy = [];
      post.likedBy.push(userId);
      post.likes = (post.likes || 0) + 1;
    }

    await post.save();

    res.status(200).json({
      message: alreadyLiked ? "Unlike thành công" : "Like thành công",
      data: {
        postId,
        likes: post.likes,
        likedBy: post.likedBy,
        isLiked: !alreadyLiked,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi like post", 
      error: error.message 
    });
  }
});

export default router;
import express from "express";
import Post from "../models/posts.model.js";
import Comment from "../models/comments.model.js";
import { getNeo4jSession } from "../config/database.js";
import { withFailover, handleShardError } from "../config/failover.js";

const router = express.Router();

// Lấy tất cả posts
router.get("/", async (req, res) => {
  try {
    const posts = await withFailover(
      Post.find().sort({ createdAt: -1 })
    );
    const data = posts.map((post) => ({
      id: post._id.toString(),
      content: post.content,
      author: post.author,
      userId: post.authorId?.toString(),
      createdAt: post.createdAt,
      likes: post.likes || 0,
      likedBy: post.likedBy?.map(id => id.toString()) || [],
    }));

    res.status(200).json({
      message: "Lấy dữ liệu bài viết thành công",
      data: data,
      total: posts.length,
    });
  } catch (err) {
    return handleShardError(err, res, 'lấy dữ liệu bài viết');
  }
});

// Tạo post mới
router.post("/", async (req, res) => {
  try {
    // Kiểm tra nếu là admin thì không cho tạo post
    if (req.body.userId) {
      const User = (await import('../models/users.model.js')).default;
      const user = await withFailover(
        User.findById(req.body.userId)
      );
      if (user && user.role === 'admin') {
        return res.status(403).json({
          message: "Admin không được tạo post. Chỉ user mới có thể tạo post.",
        });
      }
    }

    // Map userId từ request thành authorId cho model
    const postData = {
      content: req.body.content,
      author: req.body.author,
      authorId: req.body.userId,
      tags: req.body.tags || [],
      isPublished: req.body.isPublished !== undefined ? req.body.isPublished : true,
    };

    const newPost = new Post(postData);
    const savedPost = await newPost.save();

    // Tạo quan hệ trong Neo4j nếu có userId
    if (req.body.userId) {
      const session = getNeo4jSession();

      await session.run(
        `MATCH (u:User {id: $userId}) 
         CREATE (u)-[:CREATED {at: datetime()}]->(p:Post {id: $postId})`,
        {
          userId: req.body.userId,
          postId: savedPost._id.toString(),
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

// Tạo comment mới cho post - POST /api/posts/:postId/comments
router.post("/:postId/comments", async (req, res) => {
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

// Like post - POST /api/posts/:postId/like
router.post("/:postId/like", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId là bắt buộc" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post không tồn tại" });
    }

    // Kiểm tra đã like chưa
    const alreadyLiked = post.likedBy?.includes(userId);
    
    if (alreadyLiked) {
      // Unlike
      post.likedBy = post.likedBy.filter(id => id.toString() !== userId);
      post.likes = Math.max(0, (post.likes || 0) - 1);
    } else {
      // Like
      if (!post.likedBy) post.likedBy = [];
      post.likedBy.push(userId);
      post.likes = (post.likes || 0) + 1;
    }

    await post.save();

    res.status(200).json({
      message: alreadyLiked ? "Unlike thành công" : "Like thành công",
      data: {
        postId,
        likes: post.likes,
        likedBy: post.likedBy,
        isLiked: !alreadyLiked,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi khi like post", 
      error: error.message 
    });
  }
});

export default router;
