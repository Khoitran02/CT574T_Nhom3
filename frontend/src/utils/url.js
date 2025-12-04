// Lấy base URL từ environment variable hoặc fallback về localhost
export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};

// Helper để tạo URL đầy đủ cho các resource (images, uploads)
export const getResourceUrl = (path) => {
  if (!path) return '';
  
  // Nếu đã là URL đầy đủ, return luôn
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Nếu không, thêm base URL
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
