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
const initializeDatabases = async () => {
  const results = {
    mongodb_posts: false,
    mongodb_photos: false,
    neo4j: false
  };

  // MongoDB Posts
  try {
    await connectMongoDBPost();
    results.mongodb_posts = true;
  } catch (error) {
    console.warn('⚠️  MongoDB Posts connection failed:', error.message);
  }

  // MongoDB Photos  
  try {
    await connectMongoDBPhotos();
    results.mongodb_photos = true;
  } catch (error) {
    console.warn('⚠️  MongoDB Photos connection failed:', error.message);
  }

  // Neo4j
  try {
    await connectNeo4j();
    results.neo4j = true;
  } catch (error) {
    console.warn('⚠️  Neo4j connection failed:', error.message);
    console.log('💡 Để kết nối Neo4j, hãy làm theo hướng dẫn trong NEO4J_SETUP.md');
  }

  const connectedCount = Object.values(results).filter(Boolean).length;
  console.log(`✅ ${connectedCount}/3 databases đã kết nối thành công`);
  console.log('Database status:', results);
  
  if (connectedCount === 0) {
    console.error('❌ Không có database nào kết nối được. Kiểm tra cấu hình.');
    process.exit(1);
  }
};

initializeDatabases();

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

// Start server
const PORT = process.env.PORT || 3000;

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên port ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}`);
    console.log(`🧪 Neo4j Demo: http://localhost:${PORT}/api/neo4j/test`);
  });
};

// Start server after database initialization
setTimeout(() => {
  startServer();
}, 1000); // Đợi 1 giây để databases kết nối xong

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🔄 Đang dừng server...");
  await closeAllConnections();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🔄 Đang dừng server...");
  await closeAllConnections();
  process.exit(0);
});

export default app;
