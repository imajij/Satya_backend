import mongoose from "mongoose";

const emailVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// TTL index to automatically delete expired tokens after 24 hours past expiration
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

const EmailVerification = mongoose.model("EmailVerification", emailVerificationSchema);

export default EmailVerification;
