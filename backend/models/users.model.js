import mongoose from "mongoose";
import { getMongoConnection } from "../config/database.js";

const getTodayUTC7 = () => {
  const now = new Date();
  const utc7Time = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return utc7Time;
};

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    isActive: {
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

let UserModel = null;

const getUserModel = () => {
  if (!UserModel) {
    const connection = getMongoConnection();
    UserModel = connection.model("User", userSchema);
  }
  return UserModel;
};

export default new Proxy(function () {}, {
  get(target, prop) {
    return getUserModel()[prop];
  },
  construct(target, args) {
    const Model = getUserModel();
    return new Model(...args);
  },
  apply(target, thisArg, args) {
    return getUserModel()(...args);
  },
});
