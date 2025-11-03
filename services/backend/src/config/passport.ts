import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import { generateUsername } from "../utils/auth.js";

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/auth/google/callback`,
      proxy: true, // Trust proxy for callback URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, update last login
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        // Check if user exists with this email (from email/password registration)
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found in Google profile"), undefined);
        }

        user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
          // Link Google account to existing email/password account
          user.googleId = profile.id;
          user.authProvider = "google";
          user.isEmailVerified = true; // Google emails are verified
          user.lastLogin = new Date();
          
          // Update profile picture if not set
          if (!user.profilePic && profile.photos?.[0]?.value) {
            user.profilePic = profile.photos[0].value;
          }
          
          await user.save();
          return done(null, user);
        }

        // Create new user
        const firstName = profile.name?.givenName || "";
        const lastName = profile.name?.familyName || "";
        
        // Generate username - pass email as first param, then firstName and lastName
        const username = await generateUsername(email, firstName, lastName, async (u) => {
          const existing = await User.findOne({ username: u });
          return !existing;
        });

        const newUser = await User.create({
          googleId: profile.id,
          email: email.toLowerCase(),
          firstName,
          lastName,
          username,
          profilePic: profile.photos?.[0]?.value || null,
          authProvider: "google",
          isEmailVerified: true, // Google emails are pre-verified
          lastLogin: new Date(),
        });

        return done(null, newUser);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

// Serialize user for session (if using sessions)
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// Deserialize user from session (if using sessions)
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
