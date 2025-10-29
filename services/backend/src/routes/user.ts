import { Router } from "express";
import type { Request, Response } from "express";
import { clerkClient } from "@clerk/express";
import { requireClerkAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const userRouter = Router();

userRouter.get(
  "/me",
  requireClerkAuth,
  async (req: Request, res: Response) => {
    const { auth } = req as AuthenticatedRequest;
    const { userId } = auth;

    if (!userId) {
      return res.status(401).json({ error: "unauthenticated" });
    }

    try {
      const user = await clerkClient.users.getUser(userId);

      return res.json({
        data: {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? null,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          createdAt: user.createdAt,
          sessionId: auth.sessionId
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: "user_fetch_failed",
        message: "Unable to retrieve user information from Clerk."
      });
    }
  }
);

export default userRouter;
