import express from "express";

const router = express.Router();

let databaseStatus = [];

export const setDatabaseStatus = (status) => {
  databaseStatus = status;
};

router.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Social Network API Server",
    project: "CT574T - MongoDB Sharded Cluster + Neo4j",
    databases: databaseStatus.map(db => ({
      name: db.database,
      status: db.status,
      type: db.type || 'unknown',
      uri: db.uri || 'hidden',
      message: db.message,
    })),
    architecture: {
      mongodb: "Native Sharded Cluster (6 mongod + 1 mongos)",
      neo4j: "Local Graph Database",
      sharding: "Enabled with 3 shards"
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
