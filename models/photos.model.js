// models/photoModel.js
import mongoose from "mongoose";
import { connectMongoPhotos } from "../config/database.js";
import Counter from "./counter.model.js";

const photoConnection = await connectMongoPhotos();

const photoSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    uploadedBy: { type: String, default: "Unknown" },
    imageData: { type: String, required: true },
  },
  { timestamps: true }
);

photoSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "photoId" },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    this.id = counter.seq;
  }
  next();
});

const Photo = photoConnection.model("Photo", photoSchema);
export default Photo;
