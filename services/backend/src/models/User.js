import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    index: true,
    sparse: true, // allows null values while maintaining unique constraint when present
    default: null
  },
  authProvider: {
    type: String,
    enum: ["email", "google", "clerk", "firebase"],
    required: true,
    default: "email"
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    // Required only for email auth provider
    required: function() {
      return this.authProvider === "email";
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  profilePic: {
    type: String,
    default: null // URL to image (Cloudinary, Google, etc.)
  },
  bio: {
    type: String,
    default: "",
    maxlength: 500
  },
  roles: {
    type: [String],
    default: ["user"],
    enum: ["user", "admin", "moderator"]
  },
  googleId: {
    type: String,
    sparse: true,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Automatically creates createdAt and updatedAt
});

// Note: Indexes are defined inline with unique:true, index:true, sparse:true
// No need for separate userSchema.index() calls to avoid duplicate index warnings

// Method to get public profile (exclude sensitive data)
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    firstName: this.firstName,
    lastName: this.lastName,
    profilePic: this.profilePic,
    bio: this.bio,
    createdAt: this.createdAt
  };
};

// Method to get full profile for authenticated user (exclude password)
userSchema.methods.getFullProfile = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  if (this.firstName) {
    return this.firstName;
  }
  return this.username;
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model("User", userSchema);

export default User;
