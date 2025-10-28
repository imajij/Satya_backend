import { Router } from "express";
import type { Response } from "express";
import { clerkClient } from "@clerk/express";
import { requireClerkAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const userRouter = Router();

userRouter.get(
  "/me",
  requireClerkAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.auth;

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
          createdAt: user.createdAt
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
