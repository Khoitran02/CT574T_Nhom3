import mongoose from "mongoose";
import neo4j from "neo4j-driver";
import dotenv from "dotenv";

dotenv.config();

// MongoDB (Posts)
const connectMongoPosts = async () => {
  try {
    const conn = await mongoose
      .createConnection(
        `${process.env.MONGO_URI_POSTS}${process.env.MONGO_DB_POST}?retryWrites=true&w=majority`
      )
      .asPromise();
    console.log("--MongoDB (Posts) connected!");
    return conn;
  } catch (err) {
    console.error("MongoDB (Posts) connection error:", err.message);
  }
};

// MongoDB (Photos)
const connectMongoPhotos = async () => {
  try {
    const conn = await mongoose
      .createConnection(
        `${process.env.MONGO_URI_PHOTOS}${process.env.MONGO_DB_PHOTOS}?retryWrites=true&w=majority`
      )
      .asPromise();
    console.log("--MongoDB (Photos) connected!");
    return conn;
  } catch (err) {
    console.error("MongoDB (Photos) connection error:", err.message);
  }
};

// Neo4j
const connectNeo4j = () => {
  try {
    const driver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
    );
    console.log("--Neo4j connected!");
    return driver;
  } catch (err) {
    console.error("Neo4j connection error:", err.message);
  }
};

export { connectMongoPosts, connectMongoPhotos, connectNeo4j };
