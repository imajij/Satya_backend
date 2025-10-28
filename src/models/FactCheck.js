import mongoose from "mongoose";

const factCheckSchema = new mongoose.Schema({
  claim: {
    type: String,
    required: true
  },
  verdict: {
    type: String,
    enum: ["true", "false", "misleading"],
    required: true
  },
  source: {
    type: String,
    required: true
  },
  reference_url: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model("FactCheck", factCheckSchema);