import axios from 'axios';
import { config } from '../config/env';

export interface FactCheckResult {
  title: string;
  url: string;
  rating?: string;
  claimReview?: string;
}

export const searchFactCheck = async (query: string): Promise<FactCheckResult[]> => {
  try {
    const response = await axios.get('https://factchecktools.googleapis.com/v1alpha1/claims:search', {
      params: {
        key: config.GOOGLE_FACTCHECK_API_KEY,
        query: query,
        languageCode: 'en',
      },
    });

    if (!response.data.claims) {
      return [];
    }

    return response.data.claims.map((claim: any) => ({
      title: claim.text,
      url: claim.claimReview?.[0]?.url || '',
      rating: claim.claimReview?.[0]?.textualRating || '',
      claimReview: claim.claimReview?.[0]?.title || '',
    }));
  } catch (error) {
    console.error('Google Fact Check API error:', error);
    return [];
  }
};
