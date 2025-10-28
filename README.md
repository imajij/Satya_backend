# Satya Backend MVP

Secure news verification backend supporting Clerk authentication, curated feeds, and submission verification.

## Prerequisites

- Node.js 20+
- Clerk application with API keys and a frontend sending session tokens

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and update the values:
   - `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`: from the Clerk dashboard
   - `PORT`: API port (defaults to 4000)
   - `ALLOWED_ORIGINS`: comma-separated list for CORS (e.g. `http://localhost:3000`)
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Use `npm run build` followed by `npm start` for production mode.

## API Overview

All endpoints require a valid Clerk session token. Include the `Authorization: Bearer <token>` header from the frontend.

### Health Check
- `GET /health`
- Returns service status for monitoring.

### News Feed
- `GET /api/feed?category=technology`
- Filters against mock dataset until the news store is wired up.
- Response: `{ data: NewsArticle[], meta: { category, total } }`

### Verification
- `POST /api/verify`
- Body: `{ "text": "News or message to verify" }`
- Response: heuristic verdict `{ verdict, explanation, reputationScore, bias }`

### User Profile
- `GET /api/user/me`
- Returns Clerk user basics (`id`, `email`, `firstName`, etc.).

## Next Steps

- Replace mock data with database or ingestion pipeline.
- Plug verification endpoint into AI model or external fact-checking service.
- Add structured logging and observability.
- Expand test coverage (unit tests, integration tests) as features grow.
