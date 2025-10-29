# Satya Pipeline - Article Verification Engine

**Mission**: Trustworthy news and viral message filter

AI-powered article processing pipeline that extracts claims, fact-checks content, detects bias, and calculates credibility scores.

## 🎯 Features

- **Claim Extraction**: Google Gemini 2.0 Flash extracts factual claims
- **Fact-Checking**: Google Fact Check Tools API verifies claims
- **Bias Detection**: HuggingFace model (valurank/distilroberta-bias) analyzes sentences
- **Publisher Credibility**: MBFC database with 1600+ publishers
- **Score Calculation**: Comprehensive credibility and bias scoring
- **MongoDB Persistence**: Saves processed articles to database

## 🚀 Quick Start

```bash
npm install

# Configure environment
cp .env.example .env
# Add your API keys to .env

# Start server
npm start
```

Server runs on http://localhost:3000

## 🔑 API Endpoints

See full documentation in main project README.

## 🧪 Testing

```bash
# Run comprehensive API tests
node tests/final-api-test.js

# Test single article
node scripts/process_single_article.js articles/sample_matched_publisher.json
```

## 🎯 Current Status

✅ **All APIs Operational** - Gemini, Google Fact Check, HuggingFace, MBFC Database

## 📄 License

MIT
