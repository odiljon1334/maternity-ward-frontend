#!/bin/bash
set -e

echo "🚀 Maternity Ward — Frontend deploy boshlandi..."

# 1) Yangi kodni tortib olish
echo "📦 git pull..."
git pull origin main

# 2) Docker build va ishga tushirish
echo "🐳 Docker build va start..."
docker compose -f docker-compose.server.yml up -d --build

# 3) Eski imagelarni tozalash
echo "🧹 Eski docker imagelarni tozalash..."
docker image prune -f

echo ""
echo "✅ Frontend deploy tugadi!"
echo "🌐 http://YOUR_SERVER_IP:3003 da ochiladi"
echo "📋 Log ko'rish: docker logs maternity_frontend --tail=50 -f"
