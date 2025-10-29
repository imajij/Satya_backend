#!/bin/bash

# Quick test of the monorepo setup

echo "🧪 Testing Satya Monorepo..."
echo ""

# Check if services exist
if [ ! -d "services/scraper" ]; then
  echo "❌ Error: services/scraper not found"
  echo "Run ./setup.sh first"
  exit 1
fi

if [ ! -d "services/pipeline" ]; then
  echo "❌ Error: services/pipeline not found"
  echo "Run ./setup.sh first"
  exit 1
fi

if [ ! -d "services/backend" ]; then
  echo "❌ Error: services/backend not found"
  echo "Run ./setup.sh first"
  exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "❌ Error: .env file not found"
  echo "Copy .env.example to .env and configure your API keys"
  exit 1
fi

# Check if backend is built
if [ ! -d "services/backend/dist" ]; then
  echo "❌ Error: Backend not built"
  echo "Run 'npm run build' first"
  exit 1
fi

echo "✅ All checks passed!"
echo ""
echo "Starting services for 15 seconds..."
echo ""

# Start services with timeout
timeout 15 npm start &
PID=$!

# Wait a bit for services to start
sleep 5

echo ""
echo "Testing endpoints..."
echo ""

# Test News Scraper
echo -n "🔵 News Scraper (port 5000): "
if curl -s http://localhost:5000/healthz | grep -q "ok"; then
  echo "✅ Running"
else
  echo "❌ Not responding"
fi

# Test Pipeline
echo -n "🟡 Pipeline (port 3000): "
if curl -s http://localhost:3000/ | grep -q "satya"; then
  echo "✅ Running"
else
  echo "❌ Not responding"
fi

# Test Backend
echo -n "🟢 Backend (port 4000): "
if curl -s http://localhost:4000/health | grep -q "ok"; then
  echo "✅ Running"
else
  echo "❌ Not responding"
fi

echo ""
echo "✅ Monorepo test complete!"
echo ""
echo "To start all services: npm start"
echo "To stop: Press Ctrl+C"
echo ""

# Stop the background process
kill $PID 2>/dev/null
wait $PID 2>/dev/null
