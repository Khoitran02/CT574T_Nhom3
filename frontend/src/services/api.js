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
  getAll: (params = {}) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  updateAvatar: (id, formData) => api.patch(`/users/${id}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/users/${id}`),
};

// Posts API
export const postsAPI = {
  getAll: (params = {}) => api.get('/posts', { params }),
  getById: (id) => api.get(`/posts/${id}`),
  create: (formData) => {
    return api.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
  like: (postId, userId) => api.post(`/posts/${postId}/like`, { userId }),
  
  // Comments endpoints
  getComments: (postId, params = {}) => api.get(`/posts/${postId}/comments`, { params }),
  addComment: (postId, data) => api.post(`/posts/${postId}/comments`, data),
};

// Comments API
export const commentsAPI = {
  getAll: (params = {}) => api.get('/comments', { params }),
  getByPostId: (postId) => api.get(`/comments/post/${postId}`),
  create: (formData) => {
    return api.post('/comments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
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
  unfollow: (followerId, followeeId) => api.delete('/relationships/unfollow', { data: { followerId, followeeId } }),
  removeFollower: (userId, followerId) => api.delete('/relationships/remove-follower', { data: { userId, followerId } }),
  getFollowers: (userId, params = {}) => api.get(`/relationships/followers/${userId}`, { params }),
  getFollowing: (userId, params = {}) => api.get(`/relationships/following/${userId}`, { params }),
  getFollowingIds: (userId) => api.get(`/relationships/following-ids/${userId}`),
  getStats: (userId) => api.get(`/relationships/stats/${userId}`),
  getSuggestions: (userId, params = {}) => api.get(`/relationships/suggestions/${userId}`, { params }),
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

export default api;