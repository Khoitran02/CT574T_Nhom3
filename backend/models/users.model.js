import mongoose from "mongoose";
import { getMongoConnection } from "../config/database.js";

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
    password: {
      type: String,
      required: true,
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
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
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

export default new Proxy(function() {}, {
  get(target, prop) {
    return getUserModel()[prop];
  },
  construct(target, args) {
    const Model = getUserModel();
    return new Model(...args);
  },
  apply(target, thisArg, args) {
    return getUserModel()(...args);
  }
});