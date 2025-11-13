import mongoose from "mongoose";
import { getMongoConnection } from "../config/database.js";

const getTodayUTC7 = () => {
  const now = new Date();
  const utc7Time = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return utc7Time;
};

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
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
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      currentTime: () => getTodayUTC7(),
    },
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

export default new Proxy(function () {}, {
  get(target, prop) {
    return getPostModel()[prop];
  },
  construct(target, args) {
    const Model = getPostModel();
    return new Model(...args);
  },
  apply(target, thisArg, args) {
    return getPostModel()(...args);
  },
});
