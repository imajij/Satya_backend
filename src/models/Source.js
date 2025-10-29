import mongoose from "mongoose";

const sourceSchema = new mongoose.Schema({
  publisher: {
    type: String,
    required: true,
    unique: true
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  factual: {
    // stored as 0-100 to match existing seed/uploader behavior
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

// Export model using the exact collection name 'media_bias_publishers'
export default mongoose.model('MediaBiasPublisher', sourceSchema, 'media_bias_publishers');