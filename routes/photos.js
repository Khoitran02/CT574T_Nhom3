import express from "express";
import { Photo } from "../models/photos.model.js";

const router = express.Router();

// Lấy danh sách tất cả ảnh
router.get("/", async (req, res) => {
  const photos = await Photo.find();
  res.json(photos);
});

// Thêm ảnh mới
router.post("/", async (req, res) => {
  const photo = new Photo(req.body);
  await photo.save();
  res.json(photo);
});

// Xem chi tiết ảnh theo id
router.get("/:id", async (req, res) => {
  const photo = await Photo.findById(req.params.id);
  res.json(photo);
});

// Xoá ảnh
router.delete("/:id", async (req, res) => {
  await Photo.findByIdAndDelete(req.params.id);
  res.json({ message: "Photo deleted" });
});

export default router;
