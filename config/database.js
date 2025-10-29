import mongoose from "mongoose";
import neo4j from "neo4j-driver";

// Biến lưu trữ kết nối
let postsConnection;
let photosConnection;
let neo4jDriver;

// MongoDB Connection for Posts
export const connectMongoDBPost = async () => {
  try {
    postsConnection = await mongoose
      .createConnection(process.env.MONGO_URI_POSTS, {
        dbName: process.env.MONGO_DB_POST,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      })
      .asPromise();

    console.log("--Đã kết nối MongoDB Posts thành công");
    console.log("--Database Post:", process.env.MONGO_DB_POST);

    return postsConnection;
  } catch (err) {
    console.error("==Lỗi kết nối MongoDB Posts:", err);
    throw err;
  }
};

// MongoDB Connection for Photos
export const connectMongoDBPhotos = async () => {
  try {
    photosConnection = mongoose.createConnection(process.env.MONGO_URI_PHOTOS, {
      dbName: process.env.MONGO_DB_PHOTOS,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    // Sử dụng event listener thay vì promise
    return new Promise((resolve, reject) => {
      photosConnection.on("connected", () => {
        console.log("--Đã kết nối MongoDB Photos thành công");
        console.log("--Database Photo:", process.env.MONGO_DB_PHOTOS);
        resolve(photosConnection);
      });

      photosConnection.on("error", (err) => {
        console.error("==Lỗi kết nối MongoDB Photos:", err);
        reject(err);
      });

      photosConnection.on("disconnected", () => {
        console.log("--MongoDB Photos đã ngắt kết nối");
      });
    });
  } catch (err) {
    console.error("==Lỗi khi thiết lập kết nối MongoDB Photos:", err);
    throw err;
  }
};

export const getPostsConnection = () => postsConnection;
export const getPhotosConnection = () => photosConnection;

// Neo4j Connection với retry logic
export const connectNeo4j = async (retries = 3, delay = 5000) => {
  for (let idx = 1; idx <= retries; idx++) {
    try {
      console.log(` Thử kết nối Neo4j... Lần thứ ${idx}/${retries}`);

      neo4jDriver = neo4j.driver(
        process.env.NEO4J_URI,
        neo4j.auth.basic(
          process.env.NEO4J_USERNAME,
          process.env.NEO4J_PASSWORD
        ),
        {
          maxConnectionLifetime: 3 * 60 * 60 * 1000,
          maxConnectionPoolSize: 10, // Giảm pool size
          connectionAcquisitionTimeout: 30000,
          disableLosslessIntegers: true,
        }
      );

      // Test connection với timeout
      const session = neo4jDriver.session();
      const testResult = await Promise.race([
        session.run('RETURN "Neo4j Connected" as message'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 10000)
        ),
      ]);

      await session.close();

      console.log("--Đã kết nối Neo4j thành công");
      console.log("--Database:", process.env.NEO4J_DATABASE);
      console.log("--Instance:", process.env.AURA_INSTANCENAME);

      return neo4jDriver;
    } catch (err) {
      console.error(`==Lỗi kết nối Neo4j (lần ${idx}):`, err.message);

      if (neo4jDriver) {
        await neo4jDriver.close();
      }

      if (idx < retries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 1.5;
      } else {
        console.error("++Không thể kết nối Neo4j sau nhiều lần thử");
        throw err;
      }
    }
  }
};

export const getNeo4jDriver = () => {
  if (!neo4jDriver) {
    throw new Error("Neo4j driver chưa được khởi tạo");
  }
  return neo4jDriver;
};

// Kiểm tra trạng thái kết nối
export const checkConnectionsStatus = () => {
  return {
    mongoPosts: postsConnection ? postsConnection.readyState === 1 : false,
    mongoPhotos: photosConnection ? photosConnection.readyState === 1 : false,
    neo4j: neo4jDriver ? true : false,
  };
};

// Đóng tất cả kết nối khi server dừng
export const closeAllConnections = async () => {
  try {
    console.log("\n  Đang đóng tất cả kết nối...");

    if (neo4jDriver) {
      await neo4jDriver.close();
      console.log("--Đã đóng kết nối Neo4j");
    }

    if (postsConnection && postsConnection.readyState === 1) {
      await postsConnection.close();
      console.log("--Đã đóng kết nối MongoDB Posts");
    }

    if (photosConnection && photosConnection.readyState === 1) {
      await photosConnection.close();
      console.log("--Đã đóng kết nối MongoDB Photos");
    }
  } catch (err) {
    console.error("==Lỗi khi đóng kết nối:", err);
  }
};
