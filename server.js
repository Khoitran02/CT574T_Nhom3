import dotenv from "dotenv";
import { connectMongo } from "./config/database.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectMongo();
  app.listen(PORT, () => {});
}

startServer();
