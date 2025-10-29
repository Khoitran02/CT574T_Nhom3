import express from "express";
import { getNeo4jDriver } from "../config/database.js";

const router = express.Router();

// Tạo photo trong Neo4j
router.post("/", async (req, res) => {
  const { name, email } = req.body;
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const result = await session.run(
      `CREATE (p:Photo {
        id: $id,
        name: $name,
        email: $email,
        createdAt: datetime()
      }) RETURN p`,
      {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
      }
    );

    const photo = result.records[0].get("p").properties;

    res.status(201).json({
      message: "Tạo photo thành công",
      data: photo,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi tạo photo",
      error: err.message,
    });
  } finally {
    await session.close();
  }
});

// Lấy tất cả photos từ Neo4j
router.get("/", async (req, res) => {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const result = await session.run("MATCH (p:Photo) RETURN p");
    const photos = result.records.map((record) => record.get("p").properties);

    res.status(200).json({
      message: "Lấy dữ liệu photos thành công",
      data: photos,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy dữ liệu photos",
      error: err.message,
    });
  } finally {
    await session.close();
  }
});

// Lấy photo theo ID
router.get("/:id", async (req, res) => {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const result = await session.run("MATCH (p:Photo {id: $id}) RETURN p", {
      id: req.params.id,
    });

    if (result.records.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy photo",
      });
    }

    const photo = result.records[0].get("p").properties;

    res.status(200).json({
      message: "Lấy photo thành công",
      data: photo,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy photo",
      error: err.message,
    });
  } finally {
    await session.close();
  }
});

// Cập nhật photo
router.put("/:id", async (req, res) => {
  const { name, email } = req.body;
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const result = await session.run(
      `MATCH (p:Photo {id: $id})
       SET p.name = $name, p.email = $email, p.updatedAt = datetime()
       RETURN p`,
      {
        id: req.params.id,
        name,
        email,
      }
    );

    if (result.records.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy photo",
      });
    }

    const photo = result.records[0].get("p").properties;

    res.status(200).json({
      message: "Cập nhật photo thành công",
      data: photo,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi cập nhật photo",
      error: err.message,
    });
  } finally {
    await session.close();
  }
});

// Xóa photo
router.delete("/:id", async (req, res) => {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const result = await session.run("MATCH (p:Photo {id: $id}) DELETE p", {
      id: req.params.id,
    });

    res.status(200).json({
      message: "Xóa photo thành công",
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi xóa photo",
      error: err.message,
    });
  } finally {
    await session.close();
  }
});

export default router;
