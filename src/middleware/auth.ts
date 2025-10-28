import { ClerkExpressRequireAuth, clerkMiddleware } from "@clerk/express";
import type { Request } from "express";
import type { RequireAuthProp } from "@clerk/express";

export const clerkAuthMiddleware = clerkMiddleware();

export const requireClerkAuth = ClerkExpressRequireAuth();

export type AuthenticatedRequest = RequireAuthProp<Request>;
