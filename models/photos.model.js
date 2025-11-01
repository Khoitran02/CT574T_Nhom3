2;
import { getPhotosConnection } from "../config/database.js";

const photosConnection = getPhotosConnection();

const photoSchema = new photosConnection.Schema(
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
  },
  {
    timestamps: true,
  }
);

export default photosConnection.model("Photo", photoSchema);
