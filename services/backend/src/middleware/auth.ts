import { clerkMiddleware, requireAuth } from "@clerk/express";
import type { Request } from "express";

export const clerkAuthMiddleware = clerkMiddleware();
export const requireClerkAuth = requireAuth();

export interface AuthObject {
  userId: string;
  sessionId: string;
  actor?: Record<string, unknown> | null;
  claims?: Record<string, unknown> | null;
  getToken: (options?: { template?: string }) => Promise<string | null>;
}

export type AuthenticatedRequest = Request & { auth: AuthObject };