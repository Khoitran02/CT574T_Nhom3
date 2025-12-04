# Hướng Dẫn Triển Khai Production

## Vấn Đề Đã Được Khắc Phục

Trước đây, ảnh không load được khi release dự án vì các URL hình ảnh đã được hard-code `http://localhost:3001`. Vấn đề này đã được giải quyết bằng cách sử dụng environment variables và helper functions.

## Cấu Hình Environment Variables

### 1. Development (Môi trường phát triển)

Tạo file `frontend/.env` (hoặc copy từ `.env.example`):

```bash
VITE_API_URL=http://localhost:3001
```

> **Lưu ý**: Trong môi trường dev, nếu không có file `.env`, hệ thống sẽ tự động sử dụng `http://localhost:3001` làm mặc định.

### 2. Production (Môi trường triển khai)

Tạo file `frontend/.env.production`:

```bash
VITE_API_URL=https://your-backend-domain.com
```

**Thay `https://your-backend-domain.com` bằng URL thực tế của backend server.**

Ví dụ:
- Nếu backend deploy trên Heroku: `VITE_API_URL=https://myapp-backend.herokuapp.com`
- Nếu backend deploy trên VPS: `VITE_API_URL=https://api.example.com`
- Nếu backend cùng domain với frontend: `VITE_API_URL=https://example.com`

## Quy Trình Triển Khai

### Bước 1: Cấu Hình Backend

Đảm bảo backend server:
1. Đang chạy và có thể truy cập từ URL công khai
2. Đã cấu hình CORS cho phép frontend domain:

```javascript
// backend/app.js hoặc tương tự
const cors = require('cors');
app.use(cors({
  origin: 'https://your-frontend-domain.com', // URL của frontend
  credentials: true
}));
```

3. Đang serve static files từ thư mục `public/uploads`:

```javascript
app.use('/uploads', express.static('public/uploads'));
```

### Bước 2: Cấu Hình Frontend

1. Tạo file `.env.production` trong thư mục `frontend/`:

```bash
cd frontend
copy .env.example .env.production
```

2. Sửa file `.env.production` với URL backend thực tế:

```bash
VITE_API_URL=https://your-actual-backend-url.com
```

### Bước 3: Build Frontend

```bash
cd frontend
npm run build
```

Lệnh này sẽ:
- Đọc biến `VITE_API_URL` từ file `.env.production`
- Tạo production build trong thư mục `dist/`
- Tất cả URL hình ảnh sẽ tự động sử dụng `VITE_API_URL` thay vì `localhost:3001`

### Bước 4: Test Production Build Locally

Trước khi deploy, test local:

```bash
npm run preview
```

Mở trình duyệt và kiểm tra:
- ✅ Hình ảnh avatar có load không?
- ✅ Hình ảnh bài post có load không?
- ✅ Hình ảnh trong comments có load không?
- ✅ Hình ảnh trong modal có load không?

### Bước 5: Deploy

Deploy thư mục `frontend/dist` lên hosting của bạn:

#### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

#### Static Hosting (Nginx, Apache, etc.)
Copy nội dung thư mục `dist/` vào web root của server.

## Kiểm Tra Sau Khi Deploy

### 1. Kiểm Tra Network Tab

1. Mở Developer Tools (F12)
2. Vào tab Network
3. Reload trang
4. Tìm các request đến hình ảnh (filter: `Img`)
5. Verify URL hình ảnh:
   - ✅ **ĐÚNG**: `https://your-backend-domain.com/uploads/user-images/...`
   - ❌ **SAI**: `http://localhost:3001/uploads/user-images/...`

### 2. Kiểm Tra Console

Không được có lỗi:
- ❌ `Failed to load resource: net::ERR_CONNECTION_REFUSED`
- ❌ `Cross-Origin Request Blocked`

### 3. Kiểm Tra Tính Năng

Test các tính năng upload ảnh:
- [ ] Upload avatar
- [ ] Tạo post với hình ảnh
- [ ] Comment với hình ảnh
- [ ] Xem modal hình ảnh full size

## Troubleshooting (Khắc Phục Sự Cố)

### Vấn đề 1: Ảnh vẫn không load

**Nguyên nhân**: `VITE_API_URL` chưa được set đúng

**Giải pháp**:
1. Kiểm tra file `.env.production` có tồn tại không
2. Kiểm tra giá trị `VITE_API_URL` có đúng không
3. Rebuild lại: `npm run build`

### Vấn đề 2: CORS Error

**Nguyên nhân**: Backend chưa cho phép frontend domain

**Giải pháp**: Cập nhật CORS config trong backend:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',           // Dev
    'https://your-frontend-domain.com' // Production
  ],
  credentials: true
}));
```

### Vấn đề 3: 404 Not Found cho hình ảnh

**Nguyên nhân**: Backend chưa serve static files đúng cách

**Giải pháp**: Kiểm tra backend config:

```javascript
// Đảm bảo đường dẫn đúng
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
```

### Vấn đề 4: Mixed Content Warning (HTTP/HTTPS)

**Nguyên nhân**: Frontend dùng HTTPS nhưng backend dùng HTTP

**Giải pháp**: 
- **Tốt nhất**: Cấu hình HTTPS cho backend
- **Tạm thời**: Dùng HTTP cho cả frontend và backend (không khuyến khích)

## Cấu Trúc Code

### Helper Functions (frontend/src/utils/url.js)

```javascript
/**
 * Lấy base URL của API từ environment variable
 * Fallback về localhost:3001 nếu không có VITE_API_URL
 */
export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};

/**
 * Chuyển đổi đường dẫn tương đối thành URL đầy đủ
 * @param {string} path - Đường dẫn tương đối (VD: /uploads/user-images/123.jpg)
 * @returns {string} URL đầy đủ
 */
export const getResourceUrl = (path) => {
  if (!path) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path; // Đã là URL đầy đủ
  }
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};
```

### Cách Sử Dụng

#### Trước đây (Hard-coded):
```jsx
// ❌ SAI - Chỉ hoạt động trong dev
<img src={`http://localhost:3001${user.avatar}`} alt="Avatar" />
```

#### Bây giờ (Dynamic):
```jsx
// ✅ ĐÚNG - Hoạt động trong mọi môi trường
import { getResourceUrl } from '../utils/url';

<img src={getResourceUrl(user.avatar)} alt="Avatar" />
```

## Files Đã Được Cập Nhật

Tất cả các file sau đã được cập nhật để sử dụng `getResourceUrl()`:

### Components
- ✅ `frontend/src/components/Feed/PostCard.jsx`
- ✅ `frontend/src/components/Feed/CommentItem.jsx`
- ✅ `frontend/src/components/Feed/LikesModal.jsx`
- ✅ `frontend/src/components/Feed/EditPostModal.jsx`

### Pages
- ✅ `frontend/src/pages/Profile.jsx`
- ✅ `frontend/src/pages/UserProfile.jsx`

### Utilities
- ✅ `frontend/src/utils/url.js` (NEW)

### Configuration
- ✅ `frontend/.env.example` (NEW)

## Best Practices

### 1. Không Hard-code URLs
```jsx
// ❌ Tránh
const imageUrl = `http://localhost:3001${path}`;

// ✅ Dùng
const imageUrl = getResourceUrl(path);
```

### 2. Sử dụng Environment Variables
```jsx
// ❌ Tránh
const API_URL = 'http://localhost:3001';

// ✅ Dùng
const API_URL = import.meta.env.VITE_API_URL;
```

### 3. Kiểm Tra Before Deploy
- [ ] Test production build locally với `npm run preview`
- [ ] Verify tất cả hình ảnh load đúng
- [ ] Check console không có lỗi
- [ ] Test upload/download images

## Security Notes

1. **Không commit file `.env` vào Git**:
   ```bash
   # .gitignore
   .env
   .env.local
   .env.production
   ```

2. **Sử dụng HTTPS trong production**:
   ```bash
   # ✅ ĐÚNG
   VITE_API_URL=https://api.example.com
   
   # ⚠️ Chỉ dùng HTTP trong dev
   VITE_API_URL=http://localhost:3001
   ```

3. **Cấu hình CORS chặt chẽ**:
   ```javascript
   // Chỉ cho phép domains cụ thể
   const allowedOrigins = [
     'http://localhost:5173',
     'https://myapp.com'
   ];
   ```

## Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. ✅ File `.env.production` có đúng format không?
2. ✅ Backend URL có truy cập được không? (test bằng cURL hoặc Postman)
3. ✅ CORS có được cấu hình đúng không?
4. ✅ Static files có được serve từ backend không?
5. ✅ Build lại frontend sau khi thay đổi `.env.production`

---

**Cập nhật lần cuối**: 2024
**Phiên bản**: 1.0
