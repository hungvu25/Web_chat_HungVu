# Hướng dẫn deploy ứng dụng Chat lên VPS AWS Ubuntu

## Vấn đề gặp phải

Khi deploy lên VPS, ứng dụng vẫn cố gắng kết nối đến `localhost:3001` thay vì server production `https://dichvutot.site`. Điều này gây ra các lỗi:

1. `POST https://dichvutot.site/api/login 400 (Bad Request)`
2. `GET http://localhost:3001/api/friends net::ERR_BLOCKED_BY_CLIENT`
3. `GET http://localhost:3001/socket.io/... net::ERR_BLOCKED_BY_CLIENT`

## Giải pháp đã áp dụng

### 1. Tạo file environment variables
- `.env.development` - cho development
- `.env.production` - cho production

### 2. Cập nhật file constants.js
- Sử dụng environment variables để xác định API URL và Socket URL
- Tự động chuyển đổi giữa localhost (development) và production URL

### 3. Cập nhật các file API
- `src/api/friends.js` - sử dụng constants
- `src/api/messages.js` - sử dụng constants
- `src/socket.js` - sử dụng constants
- `src/Login.jsx` - sử dụng constants
- `src/Register.jsx` - sử dụng constants

## Cách deploy

### Bước 1: Build ứng dụng cho production
```bash
npm run build:prod
```

### Bước 2: Upload files
Upload nội dung trong folder `dist` lên web server của bạn.

### Bước 3: Cấu hình web server
Đảm bảo web server của bạn được cấu hình để serve `index.html` cho tất cả routes (Single Page Application).

#### Nginx configuration example:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

#### Apache configuration example:
```apache
RewriteEngine On
RewriteRule ^(?!.*\.).*$ /index.html [L]
```

### Bước 4: Đảm bảo backend server đang chạy
- Backend server phải chạy trên `https://dichvutot.site`
- Kiểm tra CORS settings cho phép frontend domain
- Đảm bảo SSL certificate đúng

## Kiểm tra deployment

1. Mở browser console và kiểm tra không còn lỗi kết nối localhost
2. Kiểm tra API calls đang gọi đến `https://dichvutot.site/api/...`
3. Kiểm tra Socket.IO kết nối đến `https://dichvutot.site`

## Troubleshooting

### Nếu vẫn gặp lỗi 400 Bad Request:
- Kiểm tra backend server logs
- Kiểm tra CORS configuration
- Kiểm tra request headers và body

### Nếu Socket.IO không kết nối được:
- Kiểm tra backend có hỗ trợ Socket.IO không
- Kiểm tra firewall và load balancer configuration
- Kiểm tra SSL certificate

### Nếu static files không load:
- Kiểm tra web server configuration
- Kiểm tra file permissions
- Kiểm tra paths và routing
