// config/database.js
import mongoose from "mongoose";
import neo4j from "neo4j-driver";

// MongoDB Connection
export const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_POSTS);
    console.log("--Đã kết nối MongoDB thành công");
  } catch (err) {
    console.error("==Lỗi kết nối MongoDB:", err);
  }
};

// Neo4j Connection
let neo4jDriver;

export const connectNeo4j = async () => {
  try {
    neo4jDriver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
    );
    console.log("--Đã kết nối Neo4j thành công");
    return neo4jDriver;
  } catch (err) {
    console.error("==Lỗi kết nối Neo4j:", err);
  }
};

export const getNeo4jDriver = () => neo4jDriver;
