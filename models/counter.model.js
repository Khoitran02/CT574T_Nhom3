import mongoose from "mongoose";
import { connectMongoPhotos } from "../config/database.js";

const counterConnection = await connectMongoPhotos();

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = counterConnection.model("Counter", counterSchema);
export default Counter;
