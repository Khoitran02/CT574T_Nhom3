import mongoose from "mongoose";
import { connectMongoPhotos } from "../config/database.js";

const photoConnection = await connectMongoPhotos();

const photoSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    description: { type: String, default: "" },
    uploadedBy: { type: String, default: "Unknown" },
  },
  { timestamps: true }
);

const Photo = photoConnection.model("Photo", photoSchema);

export default Photo;
