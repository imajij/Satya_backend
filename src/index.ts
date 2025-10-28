import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from src directory
dotenv.config({ path: path.join(__dirname, ".env") });
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./config/database.js";
import feedRouter from "./routes/feed.js";
import verifyRouter from "./routes/verify.js";
import userRouter from "./routes/user.js";
import { clerkAuthMiddleware } from "./middleware/auth.js";

// Temporarily commented out for testing - uncomment when you have Clerk keys
// if (!process.env.CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
//   throw new Error(
//     "Missing Clerk environment variables. Ensure CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY are configured."
//   );
// }

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim());

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(clerkAuthMiddleware);

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/feed", feedRouter);
app.use("/api/verify", verifyRouter);
app.use("/api/user", userRouter);

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
