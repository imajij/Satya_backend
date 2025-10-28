import mongoose, { Schema, Document } from 'mongoose';

export interface ISourceReputation extends Document {
  name: string;
  bias: string;
  credibilityScore: number;
  country?: string;
  updatedAt: Date;
}

const SourceReputationSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  bias: { 
    type: String, 
    enum: ['left', 'center-left', 'center', 'center-right', 'right', 'unknown'], 
    default: 'unknown' 
  },
  credibilityScore: { type: Number, required: true, min: 0, max: 100 },
  country: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<ISourceReputation>('SourceReputation', SourceReputationSchema);
