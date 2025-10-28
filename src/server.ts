import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { apiLimiter } from './middleware/rateLimiter';
import Redis from 'ioredis';

// Routes
import newsRoutes from './routes/newsRoutes';
import verifyRoutes from './routes/verifyRoutes';
import sourceRoutes from './routes/sourceRoutes';
import statsRoutes from './routes/statsRoutes';
import ingestRoutes from './routes/ingestRoutes';

// Cron jobs
import { startNewsUpdater } from './cron/newsUpdater';
import { startCleanupJob } from './cron/cleanupOldArticles';

// Initialize Redis
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

const app: Application = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(requestLogger);

// Rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/news', newsRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/sources', sourceRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ingest', ingestRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start cron jobs
startNewsUpdater();
startCleanupJob();

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${config.NODE_ENV}`);
});

export default app;
