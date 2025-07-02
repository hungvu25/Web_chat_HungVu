# Deployment Guide - Separate Backend and Frontend

## 1. Backend Deployment

### Chuẩn bị backend:
1. Copy toàn bộ thư mục `server` lên hosting backend của bạn
2. Tạo file `.env` trong thư mục server với nội dung:
```env
PORT=3001
NODE_ENV=production

# Your MongoDB connection string
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Strong JWT secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Your frontend domains
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```

### Chạy backend:
```bash
cd server
npm install
npm start
```

### Hosting phổ biến cho backend:
- **Railway**: Upload code, auto deploy
- **Heroku**: Git push deploy
- **DigitalOcean App Platform**: Git integration
- **Vercel**: Thêm file `vercel.json`
- **VPS**: PM2 process manager

### Ví dụ file vercel.json cho backend:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.js"
    }
  ]
}
```

---

## 2. Frontend Deployment

### Chuẩn bị frontend:
1. Tạo file `.env` trong thư mục root với backend URL:
```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_SOCKET_URL=https://your-backend-domain.com
```

2. Build frontend:
```bash
npm install
npm run build
```

3. Upload thư mục `dist` lên hosting frontend

### Hosting phổ biến cho frontend:
- **Vercel**: Kéo thả thư mục `dist`
- **Netlify**: Drag & drop deployment  
- **Firebase Hosting**: `firebase deploy`
- **GitHub Pages**: Upload dist content
- **Surge.sh**: `surge ./dist`

---

## 3. Cấu hình CORS quan trọng

Sau khi deploy, nhớ cập nhật `ALLOWED_ORIGINS` trong file `.env` của backend:
```env
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```

---

## 4. Kiểm tra deployment

1. **Backend**: Truy cập `https://your-backend-domain.com/api/test`
2. **Frontend**: Mở app và test login/chat
3. **Socket.IO**: Kiểm tra real-time messaging

---

## 5. Troubleshooting

### Lỗi CORS:
- Kiểm tra `ALLOWED_ORIGINS` trong backend
- Đảm bảo domain frontend đúng

### Socket.IO không kết nối:
- Kiểm tra `VITE_SOCKET_URL`
- Đảm bảo backend hỗ trợ WebSocket

### API calls failed:
- Kiểm tra `VITE_API_URL`
- Test backend endpoints trực tiếp
