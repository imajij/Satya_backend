#!/bin/bash

echo "🔧 Setting up Satya Monorepo..."
echo ""

# Create services directory
mkdir -p services

# Copy services from parent directories
echo "📦 Copying services..."

# Copy News Scraper
if [ -d "../news_scrapper/news-scraper-api" ]; then
  echo "  • Copying News Scraper..."
  cp -r ../news_scrapper/news-scraper-api services/scraper
else
  echo "  ⚠️  News Scraper not found at ../news_scrapper/news-scraper-api"
fi

# Copy Pipeline
if [ -d "../satya-pipeline-codegen-v2" ]; then
  echo "  • Copying Pipeline..."
  cp -r ../satya-pipeline-codegen-v2 services/pipeline
else
  echo "  ⚠️  Pipeline not found at ../satya-pipeline-codegen-v2"
fi

# Copy Backend
if [ -d "../Satya_backend" ]; then
  echo "  • Copying Backend..."
  cp -r ../Satya_backend services/backend
else
  echo "  ⚠️  Backend not found at ../Satya_backend"
fi

echo ""
echo "📝 Installing dependencies..."
npm install

echo ""
echo "📦 Installing service dependencies..."
npm run install-all

echo ""
echo "🏗️  Building Backend..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and configure your API keys"
echo "  2. Run 'npm start' to start all services"
echo ""
