# Deploy Chattera Frontend to Vercel - Hướng dẫn chi tiết

## Bước 1: Chuẩn bị code

1. Đảm bảo code đã được push lên GitHub
2. Chạy build test local:
```bash
npm run build:prod
```

## Bước 2: Đăng ký/Đăng nhập Vercel

1. Truy cập: https://vercel.com
2. Đăng nhập bằng GitHub account
3. Authorize Vercel để truy cập repositories

## Bước 3: Import Project

1. Click "New Project" hoặc "Add New..."
2. Chọn "Project"
3. Tìm và chọn repository `Web_chat_HungVu`
4. Click "Import"

## Bước 4: Configure Project

### Framework Preset: 
- Vercel sẽ tự detect "Vite"
- Nếu không, chọn manual "Vite"

### Build Settings:
- **Build Command**: `npm run vercel-build` (hoặc `npm run build`)
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Environment Variables:
Thêm các biến môi trường sau:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://web-production-084d.up.railway.app/api` |
| `VITE_SOCKET_URL` | `https://web-production-084d.up.railway.app` |

## Bước 5: Deploy

1. Click "Deploy"
2. Đợi quá trình build và deploy hoàn thành
3. Vercel sẽ cung cấp URL cho website

## Bước 6: Custom Domain (Optional)

1. Vào Project settings
2. Chọn "Domains"  
3. Thêm custom domain nếu muốn

## Troubleshooting

### Lỗi Build:
- Kiểm tra `package.json` có đúng dependencies
- Kiểm tra Node.js version compatibility

### Lỗi Environment Variables:
- Đảm bảo tên biến bắt đầu với `VITE_`
- Kiểm tra values không có space thừa

### Lỗi Routing:
- File `vercel.json` đã được config để handle SPA routing

## Auto Deploy

Sau khi setup xong, mỗi lần push code lên GitHub, Vercel sẽ tự động deploy lại!
