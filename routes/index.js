import express from "express";
import postRoutes from "./posts.js";
import userRoutes from "./photos.js";
import neo4jDemoRoutes from "./neo4j-demo.js";
import relationshipRoutes from "./relationships.js";

const router = express.Router();

// Kết hợp tất cả routes
router.use("/posts", postRoutes);
router.use("/users", userRoutes);
router.use("/neo4j", neo4jDemoRoutes);
router.use("/relationships", relationshipRoutes);

export default router;
