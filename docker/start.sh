#!/bin/sh
set -e

echo "🚀 Starting UnPload..."

# Run database migrations
echo "📦 Running database migrations..."
cd /app/api
npx prisma migrate deploy

# Start API in background
echo "🔌 Starting API server..."
node dist/main.js &
API_PID=$!

# Start Next.js
echo "🌐 Starting Web server..."
cd /app/web
npm start &
WEB_PID=$!

echo "✅ UnPload is ready!"
echo "   → Web: http://localhost:3000"
echo "   → API: http://localhost:4000"
echo "   → Docs: http://localhost:4000/api/docs"

# Wait for both processes
wait $API_PID $WEB_PID
