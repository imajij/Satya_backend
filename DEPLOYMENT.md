# Deployment Guide

## ✅ Monorepo Created Successfully!

Your Satya platform is now bundled into a single deployable unit.

### What Changed?

**Before:** 3 separate services
```
📁 news_scrapper/        → Deploy separately on Render
📁 satya-pipeline-v2/    → Deploy separately on Render  
📁 Satya_backend/        → Deploy separately on Render
```

**After:** 1 unified service
```
📁 satya-monorepo/
   ├── index.js          → Starts all 3 services
   ├── services/
   │   ├── scraper/     → News Scraper (internal port 5000)
   │   ├── pipeline/    → AI Pipeline (internal port 3000)
   │   └── backend/     → API Backend (external port 4000)
```

---

## 🚀 Deployment Options

### Option 1: Deploy on Render (Recommended)

#### **Step 1: Push to GitHub**

```bash
cd satya-monorepo
git init
git add .
git commit -m "Initial commit - Satya monorepo"

# Create new repo on GitHub, then:
git remote add origin https://github.com/yourusername/satya-monorepo.git
git push -u origin main
```

#### **Step 2: Create Render Service**

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:

```yaml
Name: satya-services
Runtime: Node
Root Directory: (leave empty or set to satya-monorepo if repo has multiple folders)
Build Command: npm run install-all && npm run build
Start Command: npm start
Port: 4000
Instance Type: Free (or higher for production)
```

#### **Step 3: Set Environment Variables**

Add these in Render Dashboard → Environment:

**Required (must be set):**
```
MONGO_URI=mongodb+srv://satya:password@cluster.mongodb.net/satya
GEMINI_API_KEY=your_gemini_key
GOOGLE_FACTCHECK_API_KEY=your_google_key
HUGGINGFACE_API_KEY=your_huggingface_key
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Auto-configured (already set):**
```
NEWS_SCRAPER_URL=http://localhost:5000
PIPELINE_URL=http://localhost:3000
BACKEND_PORT=4000
PIPELINE_PORT=3000
SCRAPER_PORT=5000
MONGO_DB=satya
GEMINI_MODEL=gemini-2.0-flash
```

#### **Step 4: Deploy!**

Click **"Create Web Service"** - Render will:
1. Clone your repo
2. Install all dependencies (3-4 minutes)
3. Build TypeScript backend
4. Start all services
5. Provide URL: `https://satya-services.onrender.com`

#### **Step 5: Update Frontend**

In your frontend `.env`:
```
VITE_API_URL=https://satya-services.onrender.com
```

Redeploy frontend on Vercel.

---

### Option 2: Deploy with Docker

```dockerfile
# Dockerfile (create in satya-monorepo/)
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY services/scraper/package*.json services/scraper/
COPY services/pipeline/package*.json services/pipeline/
COPY services/backend/package*.json services/backend/

# Install dependencies
RUN npm run install-all

# Copy source code
COPY . .

# Build backend
RUN npm run build

# Expose backend port
EXPOSE 4000

# Start all services
CMD ["npm", "start"]
```

Deploy to Railway, Fly.io, or any Docker platform.

---

## 🧪 Testing Locally

```bash
cd satya-monorepo
npm start
```

**Test endpoints:**
```bash
# Backend health
curl http://localhost:4000/health

# Pipeline (direct)
curl http://localhost:3000/health

# News Scraper (direct)
curl http://localhost:5000/healthz

# End-to-end verification
curl -X POST http://localhost:4000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.bbc.com/news/articles/test"}'
```

---

## 📊 Architecture Flow

```
Internet → Render (satya-services.onrender.com:4000)
                    ↓
        ┌───────────────────────────┐
        │  Single Render Instance   │
        │                           │
        │  ┌─────────────────────┐  │
        │  │ Backend :4000       │◄─┼─── External Traffic
        │  └──────┬──────────────┘  │
        │         │ localhost:3000  │
        │  ┌──────▼──────────────┐  │
        │  │ Pipeline :3000      │  │
        │  └──────┬──────────────┘  │
        │         │ localhost:5000  │
        │  ┌──────▼──────────────┐  │
        │  │ Scraper :5000       │  │
        │  └─────────────────────┘  │
        └───────────────────────────┘
                    │
                    ↓
            MongoDB Atlas
```

**Key Points:**
- Only port 4000 (Backend) is exposed externally
- Pipeline and Scraper are internal (localhost communication)
- Ultra-fast inter-service communication (no network latency)
- Single deployment, single restart, single health check

---

## 💰 Cost Comparison

**Before (3 services):**
- Render Free Tier: 3 × 750 hours/month = need to cycle services
- Render Starter: 3 × $7/month = $21/month

**After (1 service):**
- Render Free Tier: 750 hours/month ✅
- Render Starter: 1 × $7/month = $7/month ✅

**Savings: 66% cost reduction!**

---

## 🔧 Troubleshooting

### "Cannot find module" errors
```bash
cd satya-monorepo
npm run install-all
```

### Backend fails to start
```bash
npm run build
```

### Services can't communicate
Check `.env` has:
```
NEWS_SCRAPER_URL=http://localhost:5000
PIPELINE_URL=http://localhost:3000
```

### Port already in use
```bash
# Stop other instances
lsof -ti:4000 | xargs kill
lsof -ti:3000 | xargs kill
lsof -ti:5000 | xargs kill
```

---

## ✅ Deployment Checklist

- [ ] Monorepo created with `./setup.sh`
- [ ] All services start locally with `npm start`
- [ ] `.env` configured with all API keys
- [ ] Backend builds successfully (`npm run build`)
- [ ] Test endpoint: `curl localhost:4000/health`
- [ ] Push to GitHub
- [ ] Create Render web service
- [ ] Set environment variables in Render
- [ ] Deploy and wait for build
- [ ] Test Render URL: `curl https://your-url.onrender.com/health`
- [ ] Update frontend `VITE_API_URL`
- [ ] Redeploy frontend on Vercel

---

## 🎉 Benefits

✅ **Single deployment** - One service to manage  
✅ **Faster** - localhost communication between services  
✅ **Cheaper** - 66% cost reduction  
✅ **Simpler** - One .env, one build, one deploy  
✅ **Atomic** - All services update together  
✅ **Easier debugging** - All logs in one place  

---

## 🔄 Updating

To update any service:
```bash
# Make changes in services/backend, services/pipeline, or services/scraper
# Then commit and push
git add .
git commit -m "Update backend logic"
git push

# Render auto-deploys on push
```

---

## 📚 Next Steps

1. **Configure MongoDB Atlas** - Add 0.0.0.0/0 to network access
2. **Get API Keys** - Gemini, Google Fact Check, HuggingFace
3. **Setup Clerk** - Get production keys
4. **Deploy Backend** - Follow steps above
5. **Update Frontend** - Point to new backend URL
6. **Test End-to-End** - Submit article through UI

---

## 🆘 Need Help?

- Check service logs in Render Dashboard
- Use `npm start` locally to debug
- Verify environment variables are set
- Check MongoDB Atlas network access
- Ensure API keys are valid

**Common Issues:**
- "Connection refused" → Check service URLs use `localhost`
- "EADDRINUSE" → Port conflict, stop other services
- "MongoDB connection failed" → Check MONGO_URI in Render
- "API key invalid" → Verify keys in environment variables
