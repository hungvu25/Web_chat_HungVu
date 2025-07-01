#!/bin/bash

# Deployment script for server to dichvutot.site

echo "🚀 Starting server deployment to dichvutot.site..."

# Check if we're in the correct directory
if [ ! -f "server/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Build the client first
echo "🔨 Building client..."
npm run build

# Prepare server files
echo "📦 Preparing server files..."
cd server
npm install --production

# Create deployment package
echo "📦 Creating deployment package..."
cd ..
mkdir -p deploy/server
cp -r server/* deploy/server/
cp -r dist deploy/public

# Create PM2 ecosystem file
cat > deploy/ecosystem.config.js << EOF
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
EOF

# Create nginx config
cat > deploy/nginx.conf << EOF
server {
    listen 80;
    server_name dichvutot.site;

    # Serve static files
    location / {
        root /var/www/chat-app/public;
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy API requests
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Proxy Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

echo "✅ Deployment package created in ./deploy/"
echo ""
echo "📋 Next steps:"
echo "1. Upload the ./deploy/ folder to your server"
echo "2. Install Node.js and PM2 on your server"
echo "3. Copy nginx.conf to /etc/nginx/sites-available/chat-app"
echo "4. Enable the site: sudo ln -s /etc/nginx/sites-available/chat-app /etc/nginx/sites-enabled/"
echo "5. Restart nginx: sudo systemctl restart nginx"
echo "6. Start the app: pm2 start ecosystem.config.js"
echo ""
echo "🔧 Server commands to run:"
echo "  npm install -g pm2"
echo "  cd /var/www/chat-app"
echo "  pm2 start ecosystem.config.js"
echo "  pm2 save"
echo "  pm2 startup"
