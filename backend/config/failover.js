/**
 * MongoDB Shard Failover Helper
 * 
 * Provides utilities to handle MongoDB queries gracefully when shards are offline.
 * Uses read preference and timeout settings to prevent hanging requests.
 */

/**
 * Apply read preference and timeout to Mongoose query
 * @param {Query} query - Mongoose query object
 * @returns {Query} - Query with failover settings applied
 */
export const withFailover = (query) => {
  return query
    .read('primaryPreferred')
    .maxTimeMS(10000);
};

/**
 * Error handler for MongoDB shard failures
 * @param {Error} error - Error object
 * @param {Response} res - Express response object
 * @param {String} operation - Operation name (e.g., 'login', 'get users')
 */
export const handleShardError = (error, res, operation = 'operation') => {
  const isShardOffline = error.message?.includes('Could not find host matching read preference') ||
                         error.message?.includes('ECONNREFUSED') ||
                         error.name === 'MongoServerSelectionError';

  if (isShardOffline) {
    return res.status(503).json({
      message: `Hệ thống đang bảo trì. Vui lòng thử lại sau.`,
      error: 'Service temporarily unavailable',
    });
  }

  return res.status(500).json({
    message: `Lỗi khi ${operation}`,
    error: error.message,
  });
};

export default {
  withFailover,
  handleShardError,
};
