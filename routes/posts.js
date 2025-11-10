import express from "express";
import { Post } from "../models/posts.model.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const posts = await Post.find();
  res.json(posts);
});

router.post("/", async (req, res) => {
  const post = new Post(req.body);
  await post.save();
  res.json(post);
});

export default router;
