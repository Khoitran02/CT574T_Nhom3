import express from "express";
import postRoutes from "./posts.js";
import userRoutes from "./users.js";
import commentRoutes from "./comments.js";
import relationshipRoutes from "./relationships.js";
import databaseHealthRoutes from "./database-health.js";
import authRoutes from "./auth.js";

const router = express.Router();

router.use("/database-health", databaseHealthRoutes);
router.use("/auth", authRoutes);
router.use("/relationships", relationshipRoutes);
router.use("/posts", postRoutes);
router.use("/users", userRoutes);
router.use("/comments", commentRoutes);

export default router;
