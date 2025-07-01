# Deployment script for server to dichvutot.site (PowerShell version)

Write-Host "🚀 Starting server deployment to dichvutot.site..." -ForegroundColor Green

# Check if we're in the correct directory
if (-not (Test-Path "server/package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Build the client first
Write-Host "🔨 Building client..." -ForegroundColor Yellow
npm run build

# Prepare server files
Write-Host "📦 Preparing server files..." -ForegroundColor Yellow
Set-Location server
npm install --production
Set-Location ..

# Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
if (Test-Path "deploy") {
    Remove-Item -Recurse -Force deploy
}
New-Item -ItemType Directory -Path "deploy/server" -Force
Copy-Item -Recurse "server/*" "deploy/server/"
Copy-Item -Recurse "dist" "deploy/public"

# Create PM2 ecosystem file
$ecosystemConfig = @"
module.exports = {
  apps: [{
    name: 'chat-app',
    script: './server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
"@

$ecosystemConfig | Out-File -FilePath "deploy/ecosystem.config.js" -Encoding UTF8

# Create nginx config
$nginxConfig = @"
server {
    listen 80;
    server_name dichvutot.site;

    # Serve static files
    location / {
        root /var/www/chat-app/public;
        try_files `$uri `$uri/ /index.html;
    }

    # Proxy API requests
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
    }

    # Proxy Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
    }
}
"@

$nginxConfig | Out-File -FilePath "deploy/nginx.conf" -Encoding UTF8

Write-Host "✅ Deployment package created in ./deploy/" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Upload the ./deploy/ folder to your server" -ForegroundColor White
Write-Host "2. Install Node.js and PM2 on your server" -ForegroundColor White
Write-Host "3. Copy nginx.conf to /etc/nginx/sites-available/chat-app" -ForegroundColor White
Write-Host "4. Enable the site: sudo ln -s /etc/nginx/sites-available/chat-app /etc/nginx/sites-enabled/" -ForegroundColor White
Write-Host "5. Restart nginx: sudo systemctl restart nginx" -ForegroundColor White
Write-Host "6. Start the app: pm2 start ecosystem.config.js" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Server commands to run:" -ForegroundColor Cyan
Write-Host "  npm install -g pm2" -ForegroundColor White
Write-Host "  cd /var/www/chat-app" -ForegroundColor White
Write-Host "  pm2 start ecosystem.config.js" -ForegroundColor White
Write-Host "  pm2 save" -ForegroundColor White
Write-Host "  pm2 startup" -ForegroundColor White
