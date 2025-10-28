import { FactCheckMatch } from './factCheckOrchestrator';

export interface ScoringInput {
  aiFactuality: number;
  aiBias: number;
  aiSensationalism: number;
  aiToxicity?: number;
  factCheckMatches: FactCheckMatch[];
  sourceReputationScore?: number;
  sourceBias?: string;
}

export interface ScoringResult {
  credibilityScore: number;
  verdict: 'true' | 'false' | 'misleading' | 'unverified' | 'mixed';
  confidence: number;
  factors: Array<{ factor: string; weight: number; impact: string }>;
  explanation: string;
}

export class CredibilityScorer {
  score(input: ScoringInput): ScoringResult {
    const factors: Array<{ factor: string; weight: number; impact: string }> = [];
    
    // Base score from AI factuality (0-1 scale)
    let baseScore = input.aiFactuality * 0.5;
    factors.push({
      factor: 'AI Factuality Analysis',
      weight: 0.5,
      impact: `${(input.aiFactuality * 100).toFixed(0)}% factual content detected`,
    });

    // Sensationalism penalty
    const sensationalismPenalty = input.aiSensationalism * 0.2;
    baseScore -= sensationalismPenalty;
    factors.push({
      factor: 'Sensationalism Detection',
      weight: -0.2,
      impact: `${(input.aiSensationalism * 100).toFixed(0)}% sensationalism reduces score by ${(sensationalismPenalty * 100).toFixed(0)}`,
    });

    // Bias penalty
    const biasPenalty = input.aiBias * 0.1;
    baseScore -= biasPenalty;
    factors.push({
      factor: 'Bias Detection',
      weight: -0.1,
      impact: `${(input.aiBias * 100).toFixed(0)}% bias detected`,
    });

    // Toxicity penalty (if available)
    if (input.aiToxicity && input.aiToxicity > 0.5) {
      const toxicityPenalty = input.aiToxicity * 0.15;
      baseScore -= toxicityPenalty;
      factors.push({
        factor: 'Toxicity Detection',
        weight: -0.15,
        impact: `High toxicity (${(input.aiToxicity * 100).toFixed(0)}%) reduces credibility`,
      });
    }

    // Source reputation factor
    if (input.sourceReputationScore) {
      const sourceFactor = (input.sourceReputationScore / 100) * 0.15;
      baseScore += sourceFactor;
      factors.push({
        factor: 'Source Reputation',
        weight: 0.15,
        impact: `Source credibility: ${input.sourceReputationScore}/100`,
      });
    }

    // Fact-check matches - most critical factor
    let factCheckBonus = 0;
    let factCheckOverride: string | null = null;

    if (input.factCheckMatches.length > 0) {
      const bestMatch = input.factCheckMatches[0];
      
      switch (bestMatch.matchType) {
        case 'exact':
          if (bestMatch.rating.toLowerCase().includes('false')) {
            factCheckBonus = -0.4;
            factCheckOverride = 'false';
          } else if (bestMatch.rating.toLowerCase().includes('true')) {
            factCheckBonus = 0.3;
          } else if (bestMatch.rating.toLowerCase().includes('misleading')) {
            factCheckBonus = -0.2;
            factCheckOverride = 'misleading';
          }
          factors.push({
            factor: 'Exact Fact-Check Match',
            weight: factCheckBonus,
            impact: `${bestMatch.source}: "${bestMatch.rating}" - authoritative verdict`,
          });
          break;
          
        case 'partial':
          factCheckBonus = bestMatch.rating.toLowerCase().includes('false') ? -0.2 : 0.15;
          factors.push({
            factor: 'Partial Fact-Check Match',
            weight: factCheckBonus,
            impact: `${bestMatch.source}: partial match with rating "${bestMatch.rating}"`,
          });
          break;
          
        case 'similar':
          factCheckBonus = 0.05;
          factors.push({
            factor: 'Similar Fact-Check Found',
            weight: factCheckBonus,
            impact: `Related fact-check from ${bestMatch.source}`,
          });
          break;
      }
    } else {
      factors.push({
        factor: 'No Fact-Check Match',
        weight: 0,
        impact: 'No authoritative fact-checks found for this claim',
      });
    }

    baseScore += factCheckBonus;

    // Clamp score between 0 and 1
    const rawScore = Math.max(0, Math.min(1, baseScore));
    const credibilityScore = Math.round(rawScore * 100);

    // Determine verdict with rule-based overrides
    let verdict: ScoringResult['verdict'];
    
    if (factCheckOverride) {
      verdict = factCheckOverride as ScoringResult['verdict'];
    } else if (credibilityScore >= 75) {
      verdict = 'true';
    } else if (credibilityScore >= 50) {
      verdict = 'misleading';
    } else if (credibilityScore >= 30) {
      verdict = 'unverified';
    } else {
      verdict = 'false';
    }

    // Calculate confidence based on available evidence
    let confidence = 0.5; // Base confidence
    
    if (input.factCheckMatches.length > 0) {
      confidence += 0.3 * input.factCheckMatches[0].confidence;
    }
    if (input.sourceReputationScore) {
      confidence += 0.1;
    }
    if (input.aiFactuality > 0.7 || input.aiFactuality < 0.3) {
      confidence += 0.1; // High certainty from AI
    }
    
    confidence = Math.min(confidence, 1.0);

    // Generate explanation
    const topFactors = factors
      .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
      .slice(0, 3);
    
    const explanation = `Verdict: ${verdict.toUpperCase()} (Credibility: ${credibilityScore}/100, Confidence: ${(confidence * 100).toFixed(0)}%). ` +
      `Key factors: ${topFactors.map(f => f.impact).join('; ')}.`;

    return {
      credibilityScore,
      verdict,
      confidence,
      factors: factors.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)),
      explanation,
    };
  }
}
