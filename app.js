// app.js
import express from "express";
import dotenv from "dotenv";
import { connectMongoDB } from "./config/database.js";
import { connectNeo4j } from "./config/database.js";
import routes from "./routes/index.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Kết nối databases
connectMongoDB();
connectNeo4j();

// Routes
app.use("/api", routes);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server đang hoạt động",
    timestamp: new Date().toISOString(),
  });
});

export default app;
