import mongoose from "mongoose";
import { connectMongoPosts } from "../config/database.js";

const postConnection = await connectMongoPosts();

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, default: "Anonymous" },
  },
  { timestamps: true }
);

const Post = postConnection.model("Post", postSchema);

export default Post;
