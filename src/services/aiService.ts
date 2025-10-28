import axios from 'axios';
import { config } from '../config/env';

export interface AIAnalysisResult {
  biasDetected?: string;
  toneAnalysis?: string;
  sensationalismScore?: number;
  credibilityScore?: number;
  analysisText?: string;
}

export const analyzeTextWithAI = async (text: string): Promise<AIAnalysisResult> => {
  try {
    const response = await axios.post(config.AI_SERVICE_URL, {
      text: text,
    }, {
      timeout: 30000,
    });

    return {
      biasDetected: response.data.bias || 'unknown',
      toneAnalysis: response.data.tone || 'neutral',
      sensationalismScore: response.data.sensationalism_score || 0,
      credibilityScore: response.data.credibility_score || 50,
      analysisText: response.data.analysis || '',
    };
  } catch (error) {
    console.error('AI Service error:', error);
    return {
      biasDetected: 'unknown',
      toneAnalysis: 'neutral',
      sensationalismScore: 0,
      credibilityScore: 50,
      analysisText: 'AI analysis unavailable',
    };
  }
};
