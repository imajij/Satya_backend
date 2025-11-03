import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth.js";
import User from "../models/User.js";

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

/**
 * Middleware to verify JWT token from Authorization header or cookies
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header or cookies
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    // Attach userId to request
    req.userId = payload.userId;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};

/**
 * Middleware to load user data and attach to request
 */
export const loadUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error loading user:", error);
    res.status(500).json({ error: "Failed to load user" });
  }
};

/**
 * Combined middleware: authenticate and load user
 */
export const requireAuth = [authenticate, loadUser];

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const payload = verifyToken(token);
      if (payload && payload.userId) {
        req.userId = payload.userId;
        const user = await User.findById(payload.userId).select("-password");
        if (user) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without auth
    next();
  }
};

/**
 * Middleware to check if user has specific role
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if email is verified
 */
export const requireEmailVerified = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (!req.user.isEmailVerified) {
    res.status(403).json({ 
      error: "Email verification required",
      code: "EMAIL_NOT_VERIFIED"
    });
    return;
  }

  next();
};

// Legacy types for compatibility (to be removed)
export interface AuthObject {
  userId: string;
  sessionId?: string;
  actor?: Record<string, unknown> | null;
  claims?: Record<string, unknown> | null;
  getToken?: (options?: { template?: string }) => Promise<string | null>;
}

export type AuthenticatedRequest = AuthRequest;
