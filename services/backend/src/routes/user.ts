import express, { Request, Response } from "express";
import multer from "multer";
import User from "../models/User.js";
import { requireAuth, AuthRequest, optionalAuth } from "../middleware/auth.js";
import { isValidUsername } from "../utils/auth.js";
import { uploadImage, generateUploadSignature } from "../services/cloudinaryService.js";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

/**
 * GET /api/user/me
 * Get current user profile
 */
router.get("/me", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userProfile = req.user.toObject();
    delete userProfile.password;

    res.json({
      data: userProfile,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

/**
 * PATCH /api/user/me
 * Update current user profile
 */
router.patch("/me", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, firstName, lastName, bio } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Update username if provided
    if (username && username !== user.username) {
      const usernameValidation = isValidUsername(username);
      if (!usernameValidation.valid) {
        res.status(400).json({ error: usernameValidation.message });
        return;
      }

      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (existingUser) {
        res.status(409).json({ error: "Username already taken" });
        return;
      }

      user.username = username.toLowerCase();
    }

    // Update other fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;

    user.updatedAt = new Date();
    await user.save();

    const userProfile = user.toObject();
    delete userProfile.password;

    res.json({
      message: "Profile updated successfully",
      data: userProfile,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/**
 * POST /api/user/me/profile-pic
 * Upload profile picture
 */
router.post(
  "/me/profile-pic",
  requireAuth,
  upload.single("profilePic"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Upload to Cloudinary
      const { url } = await uploadImage(req.file.buffer, "satya/profiles");

      // Update user profile pic
      user.profilePic = url;
      user.updatedAt = new Date();
      await user.save();

      res.json({
        message: "Profile picture updated successfully",
        profilePic: url,
      });
    } catch (error) {
      console.error("Upload profile pic error:", error);
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  }
);

/**
 * GET /api/user/upload-signature
 * Get Cloudinary upload signature for direct client upload
 */
router.get("/upload-signature", requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const signature = generateUploadSignature("satya/profiles");
    res.json(signature);
  } catch (error) {
    console.error("Generate signature error:", error);
    res.status(500).json({ error: "Failed to generate upload signature" });
  }
});

/**
 * GET /api/users/:username
 * Get public user profile by username
 */
router.get("/:username", optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username: username.toLowerCase() }).select(
      "username firstName lastName profilePic bio createdAt"
    );

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      data: user.toObject(),
    });
  } catch (error) {
    console.error("Get public profile error:", error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

export default router;
