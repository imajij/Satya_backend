import mongoose from "mongoose";

const articleSchema = new mongoose.Schema({
  headline: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  reputation_score: {
    type: Number,
    min: 0,
    max: 100
  },
  bias: {
    type: String,
    enum: ["left", "right", "neutral"],
    default: "neutral"
  },
  fact_check_status: {
    type: String,
    enum: ["verified", "unverified", "false", "misleading"],
    default: "unverified"
  }
}, {
  timestamps: true
});

export default mongoose.model("Article", articleSchema);