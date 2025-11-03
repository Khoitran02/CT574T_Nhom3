import express from "express";
import Photo from "../models/photoModel.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const photos = await Photo.find();
    const data = photos.map((p) => ({
      id: p._id,
      title: p.title,
      url: p.url,
      description: p.description,
      uploadedBy: p.uploadedBy,
      createdAt: p.createdAt,
    }));

    res.status(200).json({
      message: "Lấy danh sách ảnh thành công",
      data,
      total: photos.length,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy dữ liệu ảnh",
      error: err.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, url, description, uploadedBy } = req.body;
    const newPhoto = await Photo.create({
      title,
      url,
      description,
      uploadedBy,
    });
    res.status(201).json({
      message: "Tải ảnh lên thành công",
      data: newPhoto,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi tải ảnh lên",
      error: err.message,
    });
  }
});

export default router;
