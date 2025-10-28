# Satya Backend - Misinformation Detection Platform

A scalable, secure Node.js backend for detecting misinformation and analyzing news credibility.

## Features

- 🔍 News aggregation from multiple sources
- 🤖 AI-powered bias and credibility analysis
- ✅ Fact-checking integration
- 📊 Source reputation management
- 🔒 Secure JWT authentication
- ⚡ Rate limiting and API protection
- 📅 Automated news updates via cron jobs

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys and credentials
   ```

3. **Build TypeScript:**
   ```bash
   npm run build
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Run production server:**
   ```bash
   npm start
   ```

## API Endpoints

- `GET /api/news` - Fetch news articles
- `GET /api/news/trending` - Get trending news
- `POST /api/verify` - Verify content credibility
- `GET /api/sources` - Get source reputations
- `GET /api/stats` - Get platform statistics

## Environment Variables

See `.env.example` for required configuration.

## Project Structure

This project uses a modular architecture with the following components:

- **Core Services:**
  - `app.ts`: Main application file
  - `config.ts`: Configuration file
  - `server.ts`: Server file
  - `types.ts`: TypeScript definitions

- **API Services:**
  - `news.ts`: News aggregation and analysis
  - `verify.ts`: Content credibility verification
  - `sources.ts`: Source reputation management
  - `stats.ts`: Platform statistics

- **Data Storage:**
  - `db.ts`: Database file
  - `models.ts`: TypeScript models

- **Utilities:**
  - `utils.ts`: Utility functions

## Architecture

The project is structured as follows:

- **Core Services:**
  - `app.ts`: Main application file
  - `config.ts`: Configuration file
  - `server.ts`: Server file
  - `types.ts`: TypeScript definitions

- **API Services:**
  - `news.ts`: News aggregation and analysis
  - `verify.ts`: Content credibility verification
  - `sources.ts`: Source reputation management
  - `stats.ts`: Platform statistics

- **Data Storage:**
  - `db.ts`: Database file
  - `models.ts`: TypeScript models

- **Utilities:**
  - `utils.ts`: Utility functions

