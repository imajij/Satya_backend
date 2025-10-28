import mongoose from "mongoose";

const sourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  domain: {
    type: String,
    required: true,
    unique: true
  },
  reputation_score: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  bias: {
    type: String,
    enum: ["left", "right", "neutral"],
    default: "neutral"
  }
}, {
  timestamps: true
});

export default mongoose.model("Source", sourceSchema);