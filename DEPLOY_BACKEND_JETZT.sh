#!/bin/bash
# Deploy Backend mit neuem Logging

echo "🚀 Deploying Backend with enhanced logging..."

# 1. Pull latest code
git pull origin master

# 2. Install dependencies (falls neue)
cd server
npm install

# 3. Restart backend
pm2 restart moving-assistant-api

# 4. Show logs
echo ""
echo "📋 Zeige Logs... (Ctrl+C zum Beenden)"
echo "================================================"
pm2 logs moving-assistant-api --lines 50

