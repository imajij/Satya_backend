# Satya Monorepo

Unified repository containing all backend services for the Satya news verification platform.

## Structure

```
satya-monorepo/
├── index.js              # Main entry point - starts all services
├── package.json          # Root package with scripts
├── .env                  # Unified environment variables
└── services/
    ├── scraper/          # News Scraper (Port 5000)
    ├── pipeline/         # AI Pipeline (Port 3000)
    └── backend/          # Express API (Port 4000)
```

## Quick Start

### Local Development

1. **Setup**
```bash
# Clone and enter directory
cd satya-monorepo

# Install dependencies for all services
npm run install-all

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys and MongoDB URI
```

2. **Build Backend (TypeScript)**
```bash
npm run build
```

3. **Start All Services**
```bash
npm start
```

This single command starts all three services:
- 🔵 News Scraper on port 5000
- 🟡 Pipeline on port 3000  
- 🟢 Backend on port 4000

4. **Stop All Services**
Press `Ctrl+C` - all services will shut down gracefully.

## Deployment on Render

### Option 1: Single Web Service (Recommended)

Deploy as one unified service:

**Service Configuration:**
```yaml
Name: satya-backend-services
Runtime: Node
Build Command: npm run install-all && npm run build
Start Command: npm start
Port: 4000 (Backend API port)
```

**Environment Variables:** (copy from .env.example)
```
MONGO_URI=mongodb+srv://...
GEMINI_API_KEY=...
GOOGLE_FACTCHECK_API_KEY=...
HUGGINGFACE_API_KEY=...
CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEWS_SCRAPER_URL=http://localhost:5000
PIPELINE_URL=http://localhost:3000
BACKEND_PORT=4000
PIPELINE_PORT=3000
SCRAPER_PORT=5000
```

**Important Notes:**
- Since all services run in the same container, use `localhost` for inter-service URLs
- Only the backend port (4000) is exposed externally
- Frontend should connect to: `https://your-render-url.onrender.com` (backend API)
- Render free tier: Service will sleep after inactivity, all services wake together

### Option 2: Separate Services (Better for scaling)

If you need independent scaling, keep separate deployments but use this monorepo structure:

1. **News Scraper Service**
```yaml
Build: cd services/scraper && npm install
Start: cd services/scraper && npm start
Port: 5000
```

2. **Pipeline Service**
```yaml
Build: cd services/pipeline && npm install
Start: cd services/pipeline && npm start
Port: 3000
Env: NEWS_SCRAPER_URL=https://scraper-url.onrender.com
```

3. **Backend Service**
```yaml
Build: cd services/backend && npm install && npm run build
Start: cd services/backend && npm start
Port: 4000
Env: PIPELINE_URL=https://pipeline-url.onrender.com
```

## Architecture

```
┌─────────────┐
│  Frontend   │
│  (Vercel)   │
└──────┬──────┘
       │ HTTPS
       ↓
┌─────────────────────────────────┐
│  Satya Monorepo (Render)        │
│  ┌───────────────────────────┐  │
│  │  Backend (Port 4000)      │←─┼─ External Access
│  └───────────┬───────────────┘  │
│              │ localhost:3000   │
│  ┌───────────↓───────────────┐  │
│  │  Pipeline (Port 3000)     │  │
│  └───────────┬───────────────┘  │
│              │ localhost:5000   │
│  ┌───────────↓───────────────┐  │
│  │  News Scraper (Port 5000) │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
         │
         ↓ MongoDB Atlas
    [Database]
```

## Service Details

### News Scraper (Port 5000)
- Extracts content from news URLs
- Supports BBC, TOI, Guardian, HT, and generic sites
- Endpoint: `POST /api/news/scrape-url`

### Pipeline (Port 3000)
- AI-powered article processing
- Claim extraction, fact-checking, bias detection
- Endpoint: `POST /api/verify`

### Backend (Port 4000)
- REST API for frontend
- Authentication (Clerk)
- Article feed and verification endpoints
- Endpoints: `/api/feed`, `/api/verify`, `/api/user`

## Benefits of Monorepo

✅ **Single Deployment**: One service to manage on Render  
✅ **Simplified Environment**: One .env file for all services  
✅ **Faster Communication**: Services use localhost (no network latency)  
✅ **Cost Effective**: One instance instead of three  
✅ **Easy Development**: Start everything with `npm start`  
✅ **Atomic Deploys**: All services updated together  

## Troubleshooting

**Backend fails to start:**
- Make sure you ran `npm run build` first
- Check that dist/ folder exists in services/backend

**Services can't find each other:**
- Verify NEWS_SCRAPER_URL=http://localhost:5000
- Verify PIPELINE_URL=http://localhost:3000

**Port conflicts:**
- Check if ports 3000, 4000, 5000 are available
- Modify ports in .env if needed

## Development

To work on individual services:

```bash
# Work on backend
cd services/backend
npm run dev

# Work on pipeline
cd services/pipeline
npm start

# Work on scraper
cd services/scraper
npm start
```

## Production Checklist

- [ ] Set all environment variables in Render
- [ ] MongoDB Atlas network access includes Render IPs (0.0.0.0/0)
- [ ] API keys are valid (Gemini, Google Fact Check, HuggingFace)
- [ ] Clerk keys are production keys
- [ ] Frontend VITE_API_URL points to Render backend URL
- [ ] Build command completed successfully
- [ ] Health check endpoint responding
