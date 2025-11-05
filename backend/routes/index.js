import express from "express";
import postRoutes from "./posts.js";
import photoRoutes from "./photos.js";
import userRoutes from "./users.js";
import commentRoutes from "./comments.js";
import relationshipRoutes from "./relationships.js";
import neo4jDemoRoutes from "./neo4j-demo.js";

const router = express.Router();

// Kết hợp tất cả routes
router.use("/posts", postRoutes);
router.use("/photos", photoRoutes);
router.use("/users", userRoutes);
router.use("/", commentRoutes); // comments routes include /posts/:id/comments
router.use("/", relationshipRoutes); // relationship routes include /users/:id/follow
router.use("/neo4j", neo4jDemoRoutes);

export default router;
