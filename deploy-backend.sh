#!/bin/bash

echo "🚀 Deploying Backend..."

# Navigate to server directory
cd server

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start the server
echo "🔥 Starting server..."
npm start
