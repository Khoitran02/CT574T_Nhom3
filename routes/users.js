// routes/users.js
import express from "express";
import { getNeo4jDriver } from "../config/database.js";

const router = express.Router();

// Tạo user trong Neo4j
router.post("/", async (req, res) => {
  const { name, email } = req.body;
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const result = await session.run(
      `CREATE (u:User {
        id: $id,
        name: $name,
        email: $email,
        createdAt: datetime()
      }) RETURN u`,
      {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
      }
    );

    const user = result.records[0].get("u").properties;

    res.status(201).json({
      message: "Tạo user thành công",
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi tạo user",
      error: err.message,
    });
  } finally {
    await session.close();
  }
});

// Lấy tất cả users từ Neo4j
router.get("/", async (req, res) => {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const result = await session.run("MATCH (u:User) RETURN u");
    const users = result.records.map((record) => record.get("u").properties);

    res.status(200).json({
      message: "Lấy dữ liệu users thành công",
      data: users,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy dữ liệu users",
      error: err.message,
    });
  } finally {
    await session.close();
  }
});

export default router;
