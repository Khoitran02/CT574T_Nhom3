import neo4j from "neo4j-driver";
import dotenv from "dotenv";

dotenv.config();

let neo4jDriver = null;

export const connectNeo4j = async () => {
  try {
    const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
    const username = process.env.NEO4J_USERNAME || "neo4j";
    const password = process.env.NEO4J_PASSWORD || "pass1234";
    const database = process.env.NEO4J_DATABASE || "neo4j";

    neo4jDriver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
      maxConnectionLifetime: 3 * 60 * 60 * 1000,
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 2 * 60 * 1000,
    });

    const session = neo4jDriver.session({ database });
    const result = await session.run('RETURN "Connected to Neo4j!" AS message');
    console.log("Neo4j:", result.records[0].get("message"));
    console.log(`Neo4j database: ${database}`);

    await createNeo4jConstraints(session);
    await session.close();

    return neo4jDriver;
  } catch (error) {
    console.error("Neo4j connection failed:", error.message);
    throw error;
  }
};

const createNeo4jConstraints = async (session) => {
  try {
    await session.run(`
      CREATE CONSTRAINT user_id_unique IF NOT EXISTS
      FOR (u:User) REQUIRE u.id IS UNIQUE
    `);

    await session.run(`
      CREATE INDEX user_email_index IF NOT EXISTS
      FOR (u:User) ON (u.email)
    `);

    await session.run(`
      CREATE INDEX user_username_index IF NOT EXISTS  
      FOR (u:User) ON (u.username)
    `);
  } catch (error) {
    console.warn("Warning creating Neo4j constraints:", error.message);
  }
};

export const getNeo4jDriver = () => {
  if (!neo4jDriver) {
    throw new Error(
      "Neo4j driver chưa được khởi tạo. Gọi connectNeo4j() trước."
    );
  }
  return neo4jDriver;
};

export const getNeo4jSession = (database = null) => {
  const driver = getNeo4jDriver();
  const dbName = database || process.env.NEO4J_DATABASE || "neo4j";
  return driver.session({ database: dbName });
};

export const closeNeo4jConnection = async () => {
  try {
    if (neo4jDriver) {
      await neo4jDriver.close();
      console.log("Neo4j connection closed");
      neo4jDriver = null;
    }
  } catch (error) {
    console.error("Error closing Neo4j connection:", error);
  }
};

export const testNeo4jConnection = async () => {
  try {
    if (!neo4jDriver) {
      throw new Error("Neo4j driver not initialized");
    }

    const session = getNeo4jSession();

    const result = await session.run(
      'RETURN "Neo4j connection test successful!" AS message, datetime() AS timestamp'
    );
    const message = result.records[0].get("message");
    const timestamp = result.records[0].get("timestamp").toString();

    await session.close();

    return {
      status: "connected",
      message: message,
      timestamp: timestamp,
      uri: process.env.NEO4J_URI || "bolt://localhost:7687",
      database: process.env.NEO4J_DATABASE || "neo4j",
    };
  } catch (error) {
    console.error("Neo4j connection test failed:", error.message);
    throw error;
  }
};

/**
 * Utility functions for Neo4j operations
 */
export const neo4jUtils = {
  /**
   * Execute a Cypher query with parameters
   */
  executeQuery: async (cypher, parameters = {}) => {
    const session = getNeo4jSession();
    try {
      const result = await session.run(cypher, parameters);
      return result;
    } finally {
      await session.close();
    }
  },

  /**
   * Create a User node
   */
  createUser: async (userData) => {
    const cypher = `
      CREATE (u:User {
        id: $id,
        username: $username,
        email: $email,
        created: datetime(),
        updated: datetime()
      })
      RETURN u
    `;
    return await neo4jUtils.executeQuery(cypher, userData);
  },

  /**
   * Find user by ID
   */
  findUserById: async (userId) => {
    const cypher = "MATCH (u:User {id: $userId}) RETURN u";
    return await neo4jUtils.executeQuery(cypher, { userId });
  },

  /**
   * Create relationship between users
   */
  createRelationship: async (
    fromUserId,
    toUserId,
    relationshipType,
    properties = {}
  ) => {
    const cypher = `
      MATCH (from:User {id: $fromUserId}), (to:User {id: $toUserId})
      CREATE (from)-[r:${relationshipType} $properties]->(to)
      SET r.created = datetime()
      RETURN r
    `;
    return await neo4jUtils.executeQuery(cypher, {
      fromUserId,
      toUserId,
      properties,
    });
  },

  /**
   * Get database statistics
   */
  getDatabaseStats: async () => {
    try {
      const nodeCountResult = await neo4jUtils.executeQuery(
        "MATCH (n) RETURN count(n) AS nodeCount"
      );
      const relationshipCountResult = await neo4jUtils.executeQuery(
        "MATCH ()-[r]->() RETURN count(r) AS relationshipCount"
      );

      return {
        nodeCount: nodeCountResult.records[0]?.get("nodeCount").toNumber() || 0,
        relationshipCount:
          relationshipCountResult.records[0]
            ?.get("relationshipCount")
            .toNumber() || 0,
      };
    } catch (error) {
      console.error("Error getting Neo4j database stats:", error);
      return null;
    }
  },
};

export default {
  connectNeo4j,
  getNeo4jDriver,
  getNeo4jSession,
  closeNeo4jConnection,
  testNeo4jConnection,
  neo4jUtils,
};
