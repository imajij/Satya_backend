import { CredibilityScorer } from '../src/services/credibilityScorer';

describe('CredibilityScorer', () => {
  const scorer = new CredibilityScorer();

  test('should return "false" verdict for contradictory fact-check match', () => {
    const result = scorer.score({
      aiFactuality: 0.5,
      aiBias: 0.3,
      aiSensationalism: 0.4,
      factCheckMatches: [{
        source: 'Alt News',
        title: 'Test Claim',
        url: 'https://altnews.in/test',
        rating: 'False',
        matchType: 'exact',
        confidence: 0.95,
      }],
    });

    expect(result.verdict).toBe('false');
    expect(result.credibilityScore).toBeLessThan(50);
  });

  test('should return "true" verdict for high factuality and verified fact-check', () => {
    const result = scorer.score({
      aiFactuality: 0.9,
      aiBias: 0.1,
      aiSensationalism: 0.1,
      factCheckMatches: [{
        source: 'BOOM Live',
        title: 'Verified Claim',
        url: 'https://boomlive.in/verified',
        rating: 'True',
        matchType: 'exact',
        confidence: 0.9,
      }],
      sourceReputationScore: 85,
    });

    expect(result.verdict).toBe('true');
    expect(result.credibilityScore).toBeGreaterThan(70);
  });

  test('should return "misleading" for moderate scores', () => {
    const result = scorer.score({
      aiFactuality: 0.6,
      aiBias: 0.5,
      aiSensationalism: 0.5,
      factCheckMatches: [],
    });

    expect(['misleading', 'unverified']).toContain(result.verdict);
    expect(result.factors.length).toBeGreaterThan(0);
  });

  test('should provide explainability factors', () => {
    const result = scorer.score({
      aiFactuality: 0.7,
      aiBias: 0.3,
      aiSensationalism: 0.6,
      factCheckMatches: [],
    });

    expect(result.factors.length).toBeGreaterThan(2);
    expect(result.explanation).toContain('Credibility:');
    expect(result.explanation).toContain('Key factors:');
  });
});
