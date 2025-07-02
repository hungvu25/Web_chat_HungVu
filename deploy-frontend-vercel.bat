@echo off
echo Building frontend for production...
npm run build:prod

echo.
echo Frontend built successfully!
echo.
echo Next steps:
echo 1. Go to https://vercel.com
echo 2. Sign in with your GitHub account
echo 3. Import your repository
echo 4. Set environment variables in Vercel dashboard:
echo    - VITE_API_URL = https://dichvutot.site/api
echo    - VITE_SOCKET_URL = https://dichvutot.site
echo 5. Deploy!
echo.
pause
