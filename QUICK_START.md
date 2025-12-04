# Quick Start - Triển Khai Production

## 🚀 Các Bước Nhanh

### 1️⃣ Tạo File Environment (Frontend)
```bash
cd frontend
echo VITE_API_URL=https://your-backend-url.com > .env.production
```

### 2️⃣ Build Frontend
```bash
npm run build
```

### 3️⃣ Test Local (Optional)
```bash
npm run preview
```

### 4️⃣ Deploy
Upload thư mục `frontend/dist/` lên hosting

---

## 📝 Ví Dụ Cấu Hình

### Frontend `.env.production`
```bash
# Thay bằng URL backend thực tế
VITE_API_URL=https://api.yourdomain.com
```

### Backend CORS (app.js)
```javascript
app.use(cors({
  origin: 'https://yourdomain.com', // URL frontend
  credentials: true
}));
```

---

## ✅ Checklist

- [ ] Backend đang chạy và truy cập được
- [ ] CORS đã cấu hình cho frontend domain
- [ ] Tạo file `.env.production` với VITE_API_URL đúng
- [ ] Build frontend: `npm run build`
- [ ] Test local: `npm run preview`
- [ ] Deploy thư mục `dist/`
- [ ] Kiểm tra hình ảnh load được

---

## 🔍 Debug

### Ảnh không load?
1. Check Console (F12) có lỗi gì không
2. Check Network tab - URL hình ảnh có đúng không?
3. Verify VITE_API_URL trong `.env.production`
4. Rebuild: `npm run build`

### CORS Error?
```javascript
// Backend: thêm frontend domain vào allowed origins
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-frontend.com'],
  credentials: true
}));
```

---

## 📚 Chi Tiết

Xem file `PRODUCTION_DEPLOYMENT.md` để biết hướng dẫn đầy đủ.
