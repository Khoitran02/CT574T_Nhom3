import mongoose from "mongoose";
import { getMongoConnection } from "../config/database.js";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: false,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    tags: [String],
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    images: [{
      type: String,
      trim: true,
    }],
    mentions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      username: String,
      position: Number,
    }],
    emojis: [{
      emoji: String,
      position: Number,
    }],
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for sharding
postSchema.index({ authorId: 1 });
postSchema.index({ createdAt: -1 });

let PostModel = null;

const getPostModel = () => {
  if (!PostModel) {
    const connection = getMongoConnection();
    PostModel = connection.model("Post", postSchema);
  }
  return PostModel;
};

export default new Proxy(function() {}, {
  get(target, prop) {
    return getPostModel()[prop];
  },
  construct(target, args) {
    const Model = getPostModel();
    return new Model(...args);
  },
  apply(target, thisArg, args) {
    return getPostModel()(...args);
  }
});

