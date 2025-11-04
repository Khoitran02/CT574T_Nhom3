import express from "express";
import Local from "../models/local.model.js";

const Local_router = express.Router();

Local_router.get("/", async (req, res) => {
  try {
    const locals = await Local.find();

    const data = locals.map((local) => ({
      id: local._id,
      title: local.title,
      content: local.content,
      author: local.author,
      createdAt: local.createdAt,
    }));

    res.status(200).json({
      message: "Lấy dữ liệu local thành công",
      data,
      total: locals.length,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy dữ liệu",
      error: err.message,
    });
  }
});

export default Local_router;
