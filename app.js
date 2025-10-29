// app.js
import express from "express";
import dotenv from "dotenv";
import {
  connectMongoDBPost,
  connectMongoDBPhotos,
  connectNeo4j,
  closeAllConnections,
} from "./config/database.js";
import routes from "./routes/index.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Kết nối databases
connectMongoDBPost();
connectMongoDBPhotos();
connectNeo4j();
closeAllConnections();

// Routes
app.use("/api", routes);

// Health check với thông tin databases
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server đang hoạt động tốt",
    databases: {
      mongoPosts: {
        name: process.env.MONGO_DB_POST,
        status: "Connected",
      },
      mongoPhotos: {
        name: process.env.MONGO_DB_PHOTOS,
        status: "Connected",
      },
      neo4j: {
        name: process.env.NEO4J_DATABASE,
        instance: process.env.AURA_INSTANCENAME,
        status: "Connected",
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🔄 Đang dừng server...");
  await closeAllConnections();
  process.exit(0);
});

export default app;
