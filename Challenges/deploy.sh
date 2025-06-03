#!/bin/bash

echo "🚀 Starting CTF Challenges Deployment..."
echo "======================================="

# Stop existing containers if running
echo "🛑 Stopping existing containers..."
docker compose down

# Remove old images (optional - uncomment if needed)
# docker rmi ctf-idor ctf-jwt ctf-path-traversal 2>/dev/null || true

# Build all images
echo "🔨 Building all CTF challenges..."
docker compose build --no-cache

# Start all services
echo "▶️  Starting all challenges..."
docker compose up -d

# Wait a moment for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "🔍 Checking service status..."
docker compose ps

echo "✅ Deployment complete!"
echo "======================================="
echo "🌐 Challenges available at:"
echo "- IDOR Challenge: http://localhost:3003"
echo "- JWT Challenge: http://localhost:3007"
echo "- Path Traversal: http://localhost:3010"
echo "======================================="

# Test connectivity
echo "🧪 Testing connectivity..."
curl -s -o /dev/null -w "IDOR (3003): %{http_code}\n" http://localhost:3003 || echo "IDOR (3003): Connection failed"
curl -s -o /dev/null -w "JWT (3007): %{http_code}\n" http://localhost:3007 || echo "JWT (3007): Connection failed"
curl -s -o /dev/null -w "Path Traversal (3010): %{http_code}\n" http://localhost:3010 || echo "Path Traversal (3010): Connection failed"

echo "🎯 Ready for CTFd integration!"
