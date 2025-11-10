import mongoose from "mongoose";

const photoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  description: String,
  createdAt: { type: Date, default: Date.now },
});

export const Photo = mongoose.model("Photo", photoSchema);
