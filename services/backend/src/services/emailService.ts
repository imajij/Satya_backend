import nodemailer from "nodemailer";
import { hashToken } from "../utils/auth.js";
import EmailVerification from "../models/EmailVerification.js";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@satya.app";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Format sender with name and email
const formatSender = (email: string) => {
  return `Satya <${email}>`;
};

// Create transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // Use SSL for port 465
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Connection failed:", error.message);
    console.error("SMTP Config:", { host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465 });
  } else {
    console.log("✅ SMTP Server is ready to send emails");
  }
});

/**
 * Send verification email
 */
export const sendVerificationEmail = async (
  email: string,
  token: string,
  firstName?: string
): Promise<void> => {
  const verificationUrl = `${FRONTEND_URL}/auth/verify?token=${token}`;
  const name = firstName || "User";

  const mailOptions = {
    from: formatSender(EMAIL_FROM),
    to: email,
    subject: "Verify Your Satya Account",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #4F46E5;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #4F46E5;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Satya!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Thank you for signing up for Satya, your trusted news verification platform.</p>
              <p>Please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account with Satya, you can safely ignore this email.</p>
              <p>Best regards,<br>The Satya Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Hi ${name},
      
      Thank you for signing up for Satya!
      
      Please verify your email address by clicking this link:
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account with Satya, you can safely ignore this email.
      
      Best regards,
      The Satya Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent successfully to ${email}`);
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    console.error("SMTP Config:", { host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465 });
    throw new Error("Failed to send verification email");
  }
};

/**
 * Create verification token and store in database
 */
export const createVerificationToken = async (userId: string, token: string): Promise<void> => {
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Delete any existing tokens for this user
  await EmailVerification.deleteMany({ userId });

  // Create new verification token
  await EmailVerification.create({
    userId,
    tokenHash,
    expiresAt,
  });
};

/**
 * Verify token and return user ID if valid
 */
export const verifyEmailToken = async (token: string): Promise<string | null> => {
  const tokenHash = hashToken(token);

  const verification = await EmailVerification.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

  if (!verification) {
    return null;
  }

  // Delete the token after successful verification
  await EmailVerification.deleteOne({ _id: verification._id });

  return verification.userId.toString();
};

/**
 * Send password reset email (for future use)
 */
export const sendPasswordResetEmail = async (
  email: string,
  token: string,
  firstName?: string
): Promise<void> => {
  const resetUrl = `${FRONTEND_URL}/auth/reset-password?token=${token}`;
  const name = firstName || "User";

  const mailOptions = {
    from: formatSender(EMAIL_FROM),
    to: email,
    subject: "Reset Your Satya Password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #DC2626;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #DC2626;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>We received a request to reset your Satya account password.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #DC2626;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
              <p>Best regards,<br>The Satya Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};
