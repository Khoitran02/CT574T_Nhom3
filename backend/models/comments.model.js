import mongoose from "mongoose";
import { getMongoConnection } from "../config/database.js";

const getTodayUTC7 = () => {
  const now = new Date();
  const utc7Time = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return utc7Time;
};

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    isVisible: {
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

let CommentModel = null;

const getCommentModel = () => {
  if (!CommentModel) {
    const connection = getMongoConnection();
    CommentModel = connection.model("Comment", commentSchema);
  }
  return CommentModel;
};

export default new Proxy(function () {}, {
  get(target, prop) {
    return getCommentModel()[prop];
  },
  construct(target, args) {
    const Model = getCommentModel();
    return new Model(...args);
  },
  apply(target, thisArg, args) {
    return getCommentModel()(...args);
  },
});
