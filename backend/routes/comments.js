import express from "express";
import Comment from "../models/comments.model.js";
import { getNeo4jDriver } from "../config/database.js";

const router = express.Router();

// Lấy tất cả comments - GET /api/comments
router.get("/", async (req, res) => {
  try {
    const comments = await Comment.find({ isVisible: true }).sort({
      createdAt: -1,
    });

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
      error: error.message,
    });
  }
});
// Lấy comments của một post - GET /api/comments/:postId
router.get("/:postId", async (req, res) => {
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

// Tạo comment mới cho post - POST /api/comments/:postId
router.post("/:postId", async (req, res) => {
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

    // Sau khi lưu comment vào MongoDB, tạo mối quan hệ trên Neo4j
    const driver = getNeo4jDriver();
    const session = driver.session();
    let neo4jError = null;

    try {
      await session.run(
        `MATCH (u:User {id: $userId}), (p:Post {id: $postId})
         CREATE (u)-[:COMMENTED]->(c:Comment {id: $commentId, content: $content, author: $author, createdAt: datetime()})-[:ON_POST]->(p)`,
        {
          userId: savedComment.userId.toString(),
          postId: savedComment.postId.toString(),
          commentId: savedComment._id.toString(),
          content,
          author,
        }
      );
    } catch (error) {
      neo4jError = error;
      console.error("Error creating relationship in Neo4j:", error.message);
    } finally {
      await session.close();
    }

    if (neo4jError) {
      return res.status(500).json({
        message: "Lỗi khi tạo quan hệ trong Neo4j",
        error: neo4jError.message,
      });
    }

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
export default router;
