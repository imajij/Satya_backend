import mongoose from "mongoose";

const articleSchema = new mongoose.Schema({
  headline: {
    type: String,
    required: true
  },
  publisher: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  factual: {
    // publisher factual baseline or computed factuality (0-100)
    type: Number,
    min: 0,
    max: 100
  },
  bias: {
    type: String,
    enum: ["left", "right", "neutral"],
    default: "neutral"
  },
  classification: {
    // per-article classification: verified, unverified, false, misleading
    type: String,
    enum: ["verified", "unverified", "false", "misleading"],
    default: "unverified"
  },
  claims: {
    // extracted claims from the article
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  fact_check_results: {
    // fact-check results from external APIs
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  bias_analysis: {
    // detailed bias analysis from pipeline
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  mbfc_publisher_match: {
    // MBFC publisher data if matched
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model("Article", articleSchema);