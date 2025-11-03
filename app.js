import express from "express";
import dotenv from "dotenv";
import router from "./routes/index.js";
import {
  connectMongoPosts,
  connectMongoPhotos,
  connectNeo4j,
} from "./config/database.js";

dotenv.config();

const app = express();
app.use(express.json());

const initConnections = async () => {
  await connectMongoPosts();
  await connectMongoPhotos();
  connectNeo4j();
};
initConnections();

app.use("/api", router);

app.get("/", (req, res) => {
  res.send("API server đã hoạt động!");
});

export default app;
