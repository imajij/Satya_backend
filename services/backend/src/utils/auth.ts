import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || "7d";
const BCRYPT_ROUNDS = 12;

/**
 * Generate JWT token for user
 */
export const generateToken = (userId: string): string => {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as any };
  return jwt.sign({ userId }, JWT_SECRET, options);
};

/**
 * Verify JWT token and return payload
 */
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate random verification token
 */
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Hash token for storage
 */
export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Generate unique username from email or name
 */
export const generateUsername = async (
  email: string,
  firstName?: string,
  lastName?: string,
  checkUnique?: (username: string) => Promise<boolean>
): Promise<string> => {
  let baseUsername: string;

  if (firstName && lastName) {
    baseUsername = `${firstName}.${lastName}`.toLowerCase();
  } else if (firstName) {
    baseUsername = firstName.toLowerCase();
  } else {
    baseUsername = email.split("@")[0].toLowerCase();
  }

  // Remove special characters and spaces
  baseUsername = baseUsername.replace(/[^a-z0-9._]/g, "");

  if (!checkUnique) {
    return baseUsername;
  }

  // Check uniqueness and add random suffix if needed
  let username = baseUsername;
  let isUnique = await checkUnique(username);
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    const randomSuffix = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
    username = `${baseUsername}${randomSuffix}`;
    isUnique = await checkUnique(username);
    attempts++;
  }

  if (!isUnique) {
    // Last resort: use timestamp
    username = `${baseUsername}${Date.now()}`;
  }

  return username;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  return { valid: true };
};

/**
 * Validate username format
 */
export const isValidUsername = (username: string): { valid: boolean; message?: string } => {
  if (username.length < 3 || username.length > 30) {
    return { valid: false, message: "Username must be between 3 and 30 characters" };
  }
  if (!/^[a-zA-Z0-9._]+$/.test(username)) {
    return { valid: false, message: "Username can only contain letters, numbers, dots, and underscores" };
  }
  if (/^[._]|[._]$/.test(username)) {
    return { valid: false, message: "Username cannot start or end with a dot or underscore" };
  }
  if (/[._]{2,}/.test(username)) {
    return { valid: false, message: "Username cannot contain consecutive dots or underscores" };
  }
  return { valid: true };
};
