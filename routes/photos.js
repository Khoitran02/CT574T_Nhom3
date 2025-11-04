import express from "express";
import multer from "multer";
import Photo from "../models/photos.model.js";

const Photo_router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

Photo_router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, description, uploadedBy } = req.body;
    const imageData = req.file.buffer.toString("base64");

    const newPhoto = new Photo({
      title,
      description,
      uploadedBy,
      imageData: `data:${req.file.mimetype};base64,${imageData}`,
    });

    await newPhoto.save();
    res.status(201).json({ message: "✅ Lưu ảnh thành công", data: newPhoto });
  } catch (err) {
    res.status(500).json({ message: "❌ Lỗi khi lưu ảnh", error: err.message });
  }
});
export default Photo_router;
