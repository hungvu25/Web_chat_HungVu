@echo off
echo Installing Vercel CLI...
npm install -g vercel

echo.
echo Setting up environment variables...
echo You'll need to run these commands after installation:
echo.
echo vercel env add VITE_API_URL production
echo Enter: https://dichvutot.site/api
echo.
echo vercel env add VITE_SOCKET_URL production  
echo Enter: https://dichvutot.site
echo.
echo Then redeploy:
echo vercel --prod
echo.
pause
