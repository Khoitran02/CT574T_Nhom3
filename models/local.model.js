import mongoose from "mongoose";
import { connectMongoLocal } from "../config/database.js";

const localConnection = await connectMongoLocal();

const localSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, default: "Anonymous" },
  },
  { timestamps: true }
);

const Post = localConnection.model("Post", localSchema);

export default Post;
