import express from "express";
import Post from "../models/posts.model.js";
import Comment from "../models/comments.model.js";
import User from "../models/users.model.js";
import { getNeo4jSession } from "../config/database.js";
import { upload } from "../config/upload.js";

const router = express.Router();

// Lấy tất cả posts với phân trang và bộ lọc
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const currentUserId = req.query.userId; // ID của user đang xem
    
    // Build filter query - Admin không filter isPublished
    const filter = {};
    
    // KIỂM SOÁT QUYỀN RIÊNG TƯ
    if (currentUserId) {
      // Lấy danh sách người mà currentUser đang follow
      const session = getNeo4jSession();
      const followingResult = await session.run(
        `MATCH (u:User {id: $userId})-[:FOLLOWS]->(followed:User)
         RETURN followed.id as followedId`,
        { userId: currentUserId }
      );
      await session.close();
      
      const followingIds = followingResult.records.map(record => record.get('followedId'));
      
      // Filter visibility:
      // 1. Public posts: Hiển thị cho tất cả
      // 2. Followers posts: Chỉ hiển thị nếu currentUser follow tác giả HOẶC là chính tác giả
      // 3. Private posts: Chỉ hiển thị nếu là chính tác giả
      filter.$or = [
        { visibility: 'public' },
        { 
          visibility: 'followers',
          $or: [
            { authorId: { $in: followingIds } },
            { authorId: currentUserId }
          ]
        },
        { visibility: 'private', authorId: currentUserId }
      ];
    } else {
      // Người dùng chưa đăng nhập: chỉ hiển thị public posts
      filter.visibility = 'public';
    }
    
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
      .limit(limit)
      .populate('authorId', 'avatar name username')
      .populate('likedBy', 'name email avatar');
      
    const data = posts.map((post) => ({
      id: post._id.toString(),
      content: post.content,
      author: post.author,
      userId: post.authorId?._id?.toString() || post.authorId?.toString(),
      authorAvatar: post.authorId?.avatar || '',
      createdAt: post.createdAt,
      likes: post.likes || 0,
      likedBy: post.likedBy?.map(user => {
        if (typeof user === 'object' && user._id) {
          return {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            avatar: user.avatar
          };
        }
        return user.toString();
      }) || [],
      images: post.images || [],
      mentions: post.mentions || [],
      emojis: post.emojis || [],
      visibility: post.visibility || 'public',
      isEdited: post.isEdited || false,
      editedAt: post.editedAt,
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
      visibility: req.body.visibility || 'public',
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

// Cập nhật post - PUT /api/posts/:id
router.put("/:id", upload.array('images', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      content: req.body.content,
      isEdited: true,
      editedAt: new Date(),
    };

    // Parse mentions và emojis nếu có
    if (req.body.mentions) {
      updateData.mentions = JSON.parse(req.body.mentions);
    }
    if (req.body.emojis) {
      updateData.emojis = JSON.parse(req.body.emojis);
    }
    
    // Cập nhật visibility nếu có
    if (req.body.visibility) {
      updateData.visibility = req.body.visibility;
    }

    // Xử lý images: combine existing + new uploaded
    let finalImages = [];
    
    // Giữ lại existing images nếu có
    if (req.body.existingImages) {
      const existingImages = JSON.parse(req.body.existingImages);
      finalImages = [...existingImages];
    }
    
    // Thêm new uploaded images
    if (req.files && req.files.length > 0) {
      const newImagePaths = req.files.map(file => `/uploads/user-images/${file.filename}`);
      finalImages = [...finalImages, ...newImagePaths];
    }
    
    updateData.images = finalImages;

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ message: "Post không tồn tại" });
    }

    res.status(200).json({
      message: "Cập nhật post thành công",
      data: updatedPost,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi cập nhật post",
      error: error.message,
    });
  }
});

// Xóa post - DELETE /api/posts/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedPost = await Post.findByIdAndUpdate(
      id,
      { isPublished: false },
      { new: true }
    );

    if (!deletedPost) {
      return res.status(404).json({ message: "Post không tồn tại" });
    }

    res.status(200).json({
      message: "Xóa post thành công",
      data: deletedPost,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi xóa post",
      error: error.message,
    });
  }
});

export default router;
