import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  
  // Relationship endpoints
  follow: (id, followerId) => api.post(`/users/${id}/follow`, { followerId }),
  unfollow: (id, followerId) => api.delete(`/users/${id}/follow`, { data: { followerId } }),
  getFollowers: (id) => api.get(`/users/${id}/followers`),
  getFollowing: (id) => api.get(`/users/${id}/following`),
};

// Posts API
export const postsAPI = {
  getAll: () => api.get('/posts'),
  getById: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post('/posts', data),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
  like: (postId, userId) => api.post(`/posts/${postId}/like`, { userId }),
  
  // Comments endpoints
  getComments: (postId) => api.get(`/posts/${postId}/comments`),
  addComment: (postId, data) => api.post(`/posts/${postId}/comments`, data),
};

// Comments API
export const commentsAPI = {
  getAll: () => api.get('/comments'),
  getByPostId: (postId) => api.get(`/comments/post/${postId}`),
  create: (data) => api.post('/comments', data),
  delete: (id) => api.delete(`/comments/${id}`),
  like: (commentId, userId) => api.post(`/comments/${commentId}/like`, { userId }),
};

// Neo4j API
export const neo4jAPI = {
  test: () => api.get('/neo4j/test'),
  createSampleUsers: () => api.post('/neo4j/create-sample-users'),
  getNetwork: () => api.get('/relationships/network'),
};

// Relationships API (Neo4j Social Network)
export const relationshipsAPI = {
  follow: (followerId, followeeId) => api.post('/relationships/follow', { followerId, followeeId }),
  unfollow: (followerId, followeeId) => api.post('/relationships/unfollow', { followerId, followeeId }),
  getFollowers: (userId) => api.get(`/relationships/followers/${userId}`),
  getFollowing: (userId) => api.get(`/relationships/following/${userId}`),
  getFollowingIds: (userId) => api.get(`/relationships/following-ids/${userId}`),
  checkFollowStatus: (followerId, followeeId) => api.get(`/relationships/check/${followerId}/${followeeId}`),
  getMutualFriends: (userId1, userId2) => api.get(`/relationships/mutual/${userId1}/${userId2}`),
  getStats: (userId) => api.get(`/relationships/stats/${userId}`),
};

// Helper functions for relationships
export const followUser = async (followerId, followeeId) => {
  const response = await relationshipsAPI.follow(followerId, followeeId);
  return response.data;
};

export const unfollowUser = async (followerId, followeeId) => {
  const response = await relationshipsAPI.unfollow(followerId, followeeId);
  return response.data;
};

export const checkFollowStatus = async (followerId, followeeId) => {
  const response = await relationshipsAPI.checkFollowStatus(followerId, followeeId);
  return response.data;
};

export const getUserStats = async (userId) => {
  const response = await relationshipsAPI.getStats(userId);
  return response.data;
};

export const getFollowers = async (userId) => {
  const response = await relationshipsAPI.getFollowers(userId);
  return response.data;
};

export const getFollowing = async (userId) => {
  const response = await relationshipsAPI.getFollowing(userId);
  return response.data;
};

// Database status API
export const databaseAPI = {
  getStatus: () => api.get('/database-health'),
};

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Seed API
export const seedAPI = {
  createAdmin: () => api.post('/seed/admin'),
};

export default api;