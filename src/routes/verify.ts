import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { requireClerkAuth } from "../middleware/auth.js";
import { verifySubmission } from "../services/verificationService.js";

const verifyRouter = Router();

const verificationSchema = z.object({
  text: z.string().min(10, "Please provide more context so we can analyse the claim."),
  context: z.string().optional()
});

verifyRouter.post("/", requireClerkAuth, (req: Request, res: Response) => {
  const parsing = verificationSchema.safeParse(req.body);

  if (!parsing.success) {
    return res.status(400).json({
      error: "invalid_request",
      details: parsing.error.flatten()
    });
  }

  const { text } = parsing.data;
  const verification = verifySubmission(text);

  return res.json({
    data: verification,
    meta: {
      receivedTextLength: text.length
    }
  });
});

export default verifyRouter;
