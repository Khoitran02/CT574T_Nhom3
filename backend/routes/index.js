import express from "express";
import postRoutes from "./posts.js";
import userRoutes from "./users.js";
import commentRoutes from "./comments.js";
import relationshipRoutes from "./relationships.js";
import neo4jDemoRoutes from "./neo4j-demo.js";
import databaseHealthRoutes from "./database-health.js";

const router = express.Router();

router.use("/database-health", databaseHealthRoutes);
router.use("/relationships", relationshipRoutes);
router.use("/neo4j", neo4jDemoRoutes);
router.use("/posts", postRoutes);
router.use("/users", userRoutes);
router.use("/comments", commentRoutes);

export default router;
