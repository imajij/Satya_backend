import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env (prefer project root .env). Using plain dotenv.config() loads from process.cwd().
dotenv.config();
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";
import connectDB from "./config/database.js";
import feedRouter from "./routes/feed.js";
import verifyRouter from "./routes/verify.js";
import userRouter from "./routes/user.js";
import authRouter from "./routes/auth.js";

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim());

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true // Allow cookies
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Initialize Passport
app.use(passport.initialize());

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Debug endpoint to check environment variables (remove after debugging)
app.get("/debug/env", (req: Request, res: Response) => {
  res.json({
    FRONTEND_URL: process.env.FRONTEND_URL,
    BACKEND_URL: process.env.BACKEND_URL,
    NODE_ENV: process.env.NODE_ENV,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/feed", feedRouter);
app.use("/api/verify", verifyRouter);
app.use("/api/user", userRouter);
app.use("/api/users", userRouter); // Alias for public profiles

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "not_found" });
});

app.use(
  (err: unknown, req: Request, res: Response, next: NextFunction): Response | void => {
    if (res.headersSent) {
      return next(err);
    }

    if (err instanceof Error) {
      return res.status(500).json({ error: "internal_error", message: err.message });
    }

    return res.status(500).json({ error: "internal_error" });
  }
);

const port = Number(process.env.PORT ?? 4000);

// Connect to MongoDB before starting the server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`✅ Satya backend listening on port ${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
