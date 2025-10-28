import mongoose, { Schema, Document } from 'mongoose';

export interface IUserQuery extends Document {
  message: string;
  language: string;
  aiResult?: {
    biasDetected?: string;
    toneAnalysis?: string;
    credibilityScore?: number;
    analysis?: string;
  };
  verdict: string;
  sourceFound?: string;
  createdAt: Date;
}

const UserQuerySchema: Schema = new Schema({
  message: { type: String, required: true },
  language: { type: String, default: 'en' },
  aiResult: {
    biasDetected: String,
    toneAnalysis: String,
    credibilityScore: { type: Number, min: 0, max: 100 },
    analysis: String,
  },
  verdict: { 
    type: String, 
    enum: ['verified', 'misleading', 'false', 'unverified', 'needs_review'], 
    default: 'unverified' 
  },
  sourceFound: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUserQuery>('UserQuery', UserQuerySchema);
