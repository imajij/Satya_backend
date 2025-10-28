import mongoose, { Schema, Document } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  summary: string;
  source: string;
  url: string;
  language: string;
  category: string;
  bias?: string;
  credibilityScore?: number;
  verdict?: string;
  factCheckReferences?: Array<{
    title: string;
    url: string;
    rating?: string;
    claimReview?: string;
  }>;
  aiInsights?: {
    biasDetected?: string;
    toneAnalysis?: string;
    sensationalismScore?: number;
    analysisText?: string;
  };
  publishedAt?: Date;
  createdAt: Date;
}

const ArticleSchema: Schema = new Schema({
  title: { type: String, required: true, trim: true },
  summary: { type: String, required: true },
  source: { type: String, required: true, index: true },
  url: { type: String, required: true, unique: true },
  language: { type: String, default: 'en' },
  category: { type: String, index: true },
  bias: { type: String, enum: ['left', 'center', 'right', 'unknown'], default: 'unknown' },
  credibilityScore: { type: Number, min: 0, max: 100 },
  verdict: { type: String, enum: ['verified', 'misleading', 'false', 'unverified', 'mixed'], default: 'unverified' },
  factCheckReferences: [{
    title: String,
    url: String,
    rating: String,
    claimReview: String,
  }],
  aiInsights: {
    biasDetected: String,
    toneAnalysis: String,
    sensationalismScore: { type: Number, min: 0, max: 100 },
    analysisText: String,
  },
  publishedAt: { type: Date },
  createdAt: { type: Date, default: Date.now, index: true },
});

ArticleSchema.index({ title: 'text', summary: 'text' });
ArticleSchema.index({ createdAt: -1 });

export default mongoose.model<IArticle>('Article', ArticleSchema);
