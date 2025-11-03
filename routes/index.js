import express from "express";
import postRoutes from "./posts.js";
import userRoutes from "./photos.js";

const router = express.Router();

router.use("/posts", postRoutes);
router.use("/users", userRoutes);

export default router;
