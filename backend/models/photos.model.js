import mongoose from "mongoose";

const photoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    description: String,
    tags: [String],
    size: Number,
    format: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for sharding
photoSchema.index({ uploadedBy: 1 });
photoSchema.index({ createdAt: -1 });

export default mongoose.model("Photo", photoSchema);
