@echo off
echo Building for production...
npm run build:prod

echo Build completed successfully!
echo Files are ready in ./dist folder
echo.
echo Next steps:
echo 1. Upload the contents of ./dist folder to your web server
echo 2. Make sure your backend server is running on https://dichvutot.site
echo 3. Configure your web server to serve the index.html for all routes (SPA)
echo.
echo Example nginx configuration:
echo location / {
echo     try_files $uri $uri/ /index.html;
echo }

pause
