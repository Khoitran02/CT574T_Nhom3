import express from "express";
import { Comment } from "../models/comments.model.js";

const router = express.Router();

// Lấy tất cả comment
router.get("/", async (req, res) => {
  const comments = await Comment.find();
  res.json(comments);
});

// Lấy comment theo postId
router.get("/post/:postId", async (req, res) => {
  const comments = await Comment.find({ postId: req.params.postId });
  res.json(comments);
});

// Thêm comment mới
router.post("/", async (req, res) => {
  const comment = new Comment(req.body);
  await comment.save();
  res.json(comment);
});

// Xoá comment
router.delete("/:id", async (req, res) => {
  await Comment.findByIdAndDelete(req.params.id);
  res.json({ message: "Comment deleted" });
});

export default router;
