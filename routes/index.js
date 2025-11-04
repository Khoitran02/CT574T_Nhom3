import express from "express";
import postRoutes from "./posts.js";
import Photo_router from "./photos.js";
import Local_router from "./local.js";

const router = express.Router();

router.use("/posts", postRoutes);
router.use("/photos", Photo_router);
router.use("/locals", Local_router);

export default router;
