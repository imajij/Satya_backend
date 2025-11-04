import express, { Request, Response } from "express";
import passport from "../config/passport.js";
import User from "../models/User.js";
import {
  generateToken,
  hashPassword,
  comparePassword,
  generateVerificationToken,
  generateUsername,
  isValidEmail,
  isValidPassword,
  isValidUsername,
} from "../utils/auth.js";
import {
  sendVerificationEmail,
  createVerificationToken,
  verifyEmailToken,
} from "../services/emailService.js";
import { authenticate, AuthRequest, requireAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, username } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      res.status(400).json({ error: passwordValidation.message });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    // Generate or validate username
    let finalUsername = username;
    if (finalUsername) {
      const usernameValidation = isValidUsername(finalUsername);
      if (!usernameValidation.valid) {
        res.status(400).json({ error: usernameValidation.message });
        return;
      }

      const usernameExists = await User.findOne({ username: finalUsername.toLowerCase() });
      if (usernameExists) {
        res.status(409).json({ error: "Username already taken" });
        return;
      }
    } else {
      // Generate username
      finalUsername = await generateUsername(
        email,
        firstName,
        lastName,
        async (username) => {
          const exists = await User.findOne({ username });
          return !exists;
        }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      username: finalUsername.toLowerCase(),
      authProvider: "email",
      isEmailVerified: false,
    });

    // Generate verification token
    const verificationToken = generateVerificationToken();
    await createVerificationToken(user._id.toString(), verificationToken);

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken, user.firstName || undefined);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail registration if email fails
    }

    // Don't generate JWT token yet - user must verify email first
    const userProfile = user.toObject();
    delete userProfile.password;

    res.status(201).json({
      message: "Registration successful! Please check your email to verify your account.",
      user: userProfile,
      requiresVerification: true,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Check if user uses email auth
    if (user.authProvider !== "email") {
      res.status(400).json({ 
        error: `This account uses ${user.authProvider} authentication. Please sign in with ${user.authProvider}.` 
      });
      return;
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password || "");
    if (!isValidPassword) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Check email verification - REQUIRED for login
    if (!user.isEmailVerified) {
      res.status(403).json({ 
        error: "Please verify your email before logging in. Check your inbox for the verification link.",
        code: "EMAIL_NOT_VERIFIED"
      });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    const userProfile = user.toObject();
    delete userProfile.password;

    res.json({
      message: "Login successful",
      user: userProfile,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * GET /api/auth/verify
 * Verify email address with token
 */
router.get("/verify", async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "Verification token is required" });
      return;
    }

    // Verify token
    const userId = await verifyEmailToken(token);
    if (!userId) {
      res.status(400).json({ error: "Invalid or expired verification token" });
      return;
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { isEmailVerified: true },
      { new: true }
    ).select("-password");

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const userProfile = user.toObject();
    delete userProfile.password;

    res.json({
      message: "Email verified successfully",
      user: userProfile,
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend verification email (authenticated endpoint - for logged in users)
 */
router.post("/resend-verification", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({ error: "Email is already verified" });
      return;
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    await createVerificationToken(user._id.toString(), verificationToken);

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken, user.firstName || undefined);

    res.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ error: "Failed to send verification email" });
  }
});

/**
 * POST /api/auth/resend-verification-by-email
 * Resend verification email using email address (public endpoint - no auth required)
 */
router.post("/resend-verification-by-email", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Don't reveal if user exists or not for security
    if (!user) {
      res.json({ message: "If an account exists with this email, a verification link has been sent." });
      return;
    }

    // Check if already verified
    if (user.isEmailVerified) {
      res.json({ message: "If an account exists with this email, a verification link has been sent." });
      return;
    }

    // Only send email for users who registered with email/password
    if (user.authProvider !== "email") {
      res.json({ message: "If an account exists with this email, a verification link has been sent." });
      return;
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    await createVerificationToken(user._id.toString(), verificationToken);

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken, user.firstName || undefined);

    res.json({ message: "If an account exists with this email, a verification link has been sent." });
  } catch (error) {
    console.error("Resend verification by email error:", error);
    res.status(500).json({ error: "Failed to send verification email" });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side should remove token)
 */
router.post("/logout", (req: Request, res: Response): void => {
  // Clear cookie if using cookies
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

/**
 * GET /api/auth/me
 * Get current authenticated user (test endpoint)
 */
router.get("/me", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({
      user: req.user.getFullProfile(),
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`,
  }),
  async (req: any, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      
      console.log('Google OAuth callback - FRONTEND_URL:', process.env.FRONTEND_URL);
      console.log('Google OAuth callback - Using URL:', frontendUrl);
      
      if (!user) {
        res.redirect(`${frontendUrl}/login?error=no_user`);
        return;
      }

      // Generate JWT token
      const token = generateToken(user._id.toString());

      // Redirect to frontend with token
      // The frontend will extract the token from the URL and store it
      console.log('Redirecting to:', `${frontendUrl}/auth/callback?token=${token.substring(0, 20)}...`);
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error("Google callback error:", error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=callback_failed`);
    }
  }
);

/**
 * POST /api/auth/google-callback (Legacy - keeping for backward compatibility)
 * Handle Google OAuth callback (to be implemented with passport)
 */
router.post("/google-callback", async (req: Request, res: Response): Promise<void> => {
  try {
    // This will be handled by Passport Google OAuth strategy
    // Placeholder for now
    res.status(501).json({ error: "Google OAuth not yet implemented" });
  } catch (error) {
    console.error("Google callback error:", error);
    res.status(500).json({ error: "Google authentication failed" });
  }
});

export default router;
