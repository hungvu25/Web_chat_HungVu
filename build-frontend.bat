@echo off
echo 🎨 Building Frontend...

echo 📦 Installing dependencies...
npm install

echo 🔨 Building...
npm run build

echo ✅ Frontend built successfully!
echo 📁 Upload the 'dist' folder to your frontend hosting service
echo.
echo 📝 Don't forget to:
echo 1. Create .env file with your backend URLs  
echo 2. Update ALLOWED_ORIGINS in your backend .env
