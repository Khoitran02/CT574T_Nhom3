# Sample Images Guide

## Overview
Hệ thống hỗ trợ bài viết có đính kèm hình ảnh. 100 ảnh sample SVG đã được tạo sẵn (mỗi ảnh ~0.47KB).

## Sample Images

### Đặc điểm
- **Số lượng:** 100 ảnh
- **Kích thước:** ~0.47KB/ảnh (< 1KB)
- **Định dạng:** SVG (vector graphics)
- **Vị trí:** `backend/public/uploads/sample-images/`
- **Naming:** `sample-001.svg` đến `sample-100.svg`

### Categories (21 patterns)
- **Nature:** nature, forest, mountain (green theme)
- **Sky:** sky, cloud, sun (blue theme)
- **Abstract:** abstract, geometric, pattern (orange theme)
- **Tech:** tech, digital, code (purple theme)
- **Food:** food, fruit, meal (red theme)
- **Art:** art, paint, design (pink theme)
- **Sports:** sports, fitness, active (teal theme)

## Generate Images

### Command
```bash
# Từ thư mục backend
npm run generate:images
```

### Output
```
🎨 Generating 100 sample images...
✅ Generated 10/100 images
...
✅ Generated 100/100 images

✨ Successfully generated 100 sample images!
📁 Location: D:\...\backend\public\uploads\sample-images
📊 Average size: ~0.47KB per image

📝 Image list saved to: D:\...\backend\scripts\sample-images-list.json
```

### Files Created
1. **100 SVG images:** `backend/public/uploads/sample-images/sample-XXX.svg`
2. **Images list JSON:** `backend/scripts/sample-images-list.json`

## Post Model with Images

### Schema
```javascript
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  authorId: ObjectId,
  tags: [String],
  likes: Number,
  likedBy: [ObjectId],
  images: [String],  // <-- Array of image paths
  isPublished: Boolean,
}, { timestamps: true });
```

### Image Paths Format
```json
{
  "images": [
    "/uploads/sample-images/sample-042.svg",
    "/uploads/sample-images/sample-087.svg"
  ]
}
```

## Seeder Integration

### Seed Configuration
- **50% bài viết** có ảnh đính kèm
- **70% trong số đó** có 1 ảnh
- **30% còn lại** có 2 ảnh

### seed-quick.js (100 users × 50 posts)
```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load sample images
const imagesListPath = path.join(__dirname, 'sample-images-list.json');
const SAMPLE_IMAGES = fs.existsSync(imagesListPath) 
  ? JSON.parse(fs.readFileSync(imagesListPath, 'utf-8'))
  : [];

// Generate post with 50% chance of having images
const hasImages = Math.random() < 0.5;
const images = hasImages && SAMPLE_IMAGES.length > 0
  ? [
      randomElement(SAMPLE_IMAGES),
      ...(Math.random() < 0.3 ? [randomElement(SAMPLE_IMAGES)] : [])
    ]
  : [];

const post = {
  // ... other fields
  images,
};
```

### seed-large-dataset.js (2000 users × 1000 posts)
Cùng logic như seed-quick.js nhưng scale lớn hơn.

### Run Seeders
```bash
# Generate images first (one time)
npm run generate:images

# Then run seeder
npm run seed:quick   # 5,000 posts (50% with images = 2,500)
npm run seed:large   # 2,000,000 posts (50% with images = 1,000,000)
```

## API Response

### GET /api/posts
```json
{
  "message": "Lấy dữ liệu bài viết thành công",
  "data": [
    {
      "id": "67389...",
      "content": "Post content here",
      "author": "John Doe",
      "userId": "67389...",
      "createdAt": "2024-11-16T...",
      "likes": 42,
      "likedBy": [],
      "images": [
        "/uploads/sample-images/sample-023.svg",
        "/uploads/sample-images/sample-089.svg"
      ]
    }
  ],
  "pagination": {
    "total": 5000,
    "page": 1,
    "limit": 20,
    "totalPages": 250,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Frontend Display

### PostCard Component
```jsx
{/* Post Images */}
{post.images && post.images.length > 0 && (
  <div className={`mb-4 grid gap-2 ${
    post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
  }`}>
    {post.images.map((image, index) => (
      <img
        key={index}
        src={`http://localhost:3000${image}`}
        alt={`Post image ${index + 1}`}
        className="w-full h-48 object-cover rounded-lg border"
        onError={(e) => e.target.style.display = 'none'}
      />
    ))}
  </div>
)}
```

### Display Logic
- **1 image:** Full width (grid-cols-1)
- **2 images:** Side by side (grid-cols-2)
- **Image size:** h-48 (192px height), cover fit
- **Error handling:** Hide image if fails to load

## Static File Serving

### Backend Configuration
```javascript
// app.js
app.use(express.static("public"));
```

### URL Structure
- **Storage:** `backend/public/uploads/sample-images/sample-001.svg`
- **DB Path:** `/uploads/sample-images/sample-001.svg`
- **Full URL:** `http://localhost:3000/uploads/sample-images/sample-001.svg`

## SVG Image Structure

### Sample Code
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150">
  <rect width="100%" height="100%" fill="#4ade80"/>
  <circle cx="100" cy="75" r="40" fill="#22c55e" opacity="0.8"/>
  <circle cx="130" cy="60" r="25" fill="#4ade80" opacity="0.6"/>
  <circle cx="70" cy="90" r="30" fill="#22c55e" opacity="0.5"/>
  <text x="10" y="140" font-family="Arial" font-size="14" fill="#fff" opacity="0.8">
    nature-1
  </text>
</svg>
```

### Benefits of SVG
- ✅ Tiny file size (~0.47KB)
- ✅ Scalable without quality loss
- ✅ No external dependencies
- ✅ Fast loading
- ✅ Colorful patterns

## Statistics Example

### After Running seed:quick
```
✅ Generated users: 100
✅ Generated posts: 5,000
✅ Posts with images: 2,487 (49.74%)
   - 1 image: 1,742 (34.84%)
   - 2 images: 745 (14.90%)
```

### After Running seed:large
```
✅ Generated users: 2,000
✅ Generated posts: 2,000,000
✅ Posts with images: 999,234 (49.96%)
   - 1 image: ~699,464 (34.97%)
   - 2 images: ~299,770 (14.99%)
```

## Testing Images

### Manual Test
1. Generate images: `npm run generate:images`
2. Check files exist: `ls public/uploads/sample-images/ | wc -l` (should be 100)
3. Open browser: `http://localhost:3000/uploads/sample-images/sample-001.svg`
4. Should see colorful SVG pattern

### Automated Test
```bash
# Count generated files
ls backend/public/uploads/sample-images/*.svg | wc -l

# Verify all files < 1KB
find backend/public/uploads/sample-images -name "*.svg" -size +1k

# Should return nothing (all files under 1KB)
```

## Troubleshooting

### Issue: Images not loading in frontend
**Solution:**
1. Check backend is serving static files: `app.use(express.static("public"))`
2. Verify image URL: `http://localhost:3000/uploads/sample-images/sample-001.svg`
3. Check CORS if frontend on different port

### Issue: Seeder not adding images
**Solution:**
1. Run `npm run generate:images` first
2. Check `sample-images-list.json` exists
3. Verify `SAMPLE_IMAGES` array is loaded in seeder

### Issue: Images array empty in DB
**Solution:**
1. Check 50% random logic: `Math.random() < 0.5`
2. Verify `SAMPLE_IMAGES.length > 0`
3. Check post model has `images: [String]` field

## Future Enhancements

### 1. Real Image Upload
```javascript
import multer from 'multer';

const upload = multer({
  dest: 'public/uploads/user-images/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.post('/posts', upload.array('images', 2), async (req, res) => {
  const images = req.files.map(f => `/uploads/user-images/${f.filename}`);
  // Save post with images
});
```

### 2. Image Optimization
- Resize images on upload
- Generate thumbnails
- WebP conversion
- CDN storage

### 3. More Image Formats
- Support PNG, JPG, WebP
- Video thumbnails
- GIF support

### 4. Advanced Features
- Image captions
- Alt text for accessibility
- Lightbox viewer
- Image filters/effects

---

**Last Updated:** November 2024  
**Related Files:**
- `backend/scripts/generate-sample-images.js`
- `backend/scripts/sample-images-list.json`
- `backend/models/posts.model.js`
- `frontend/src/components/Feed/PostCard.jsx`
