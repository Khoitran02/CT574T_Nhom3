import express from "express";
import postRoutes from "./posts.js";
import Photo_router from "./photos.js";
import Comment_router from "./comments.js";
const router = express.Router();

router.use("/posts", postRoutes);
router.use("/photos", Photo_router);
router.use("/comment", Comment_router);

export default router;
