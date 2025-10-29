import { BIAS_PENALTY_FACTOR, DEFAULT_PUBLISHER_FACTUALITY } from './config.js'

export function computeArticleBiasScore(mbfcMatch, biasMagnitude) {
  if (mbfcMatch) {
    const sign = Math.sign(mbfcMatch.mbfc_bias_score || 0)
    const a = Math.abs(mbfcMatch.mbfc_bias_score || 0)
    const score = sign * (a * 0.6 + biasMagnitude * 0.4)
    return Math.max(-1, Math.min(1, score))
  }
  if (biasMagnitude) {
    return Math.max(-1, Math.min(1, biasMagnitude))
  }
  return 0
}

export function computeCredibilityScore(mbfcMatch, falseClaimRatio, biasMagnitude) {
  const mbfc_factuality = (mbfcMatch && (mbfcMatch.mbfc_factuality_score || DEFAULT_PUBLISHER_FACTUALITY)) || DEFAULT_PUBLISHER_FACTUALITY
  const c = mbfc_factuality * (1 - falseClaimRatio) * (1 - biasMagnitude * BIAS_PENALTY_FACTOR)
  return Math.max(0, Math.min(1, c))
}

export function classifyArticle(checkedCount, falseClaimRatio, verifiedCount, credibilityScore = 0, mbfcMatch = null) {
  // If we have fact-check results, use them for classification
  if (checkedCount > 0) {
    if (falseClaimRatio >= 0.5) return 'false'
    if (falseClaimRatio > 0 && falseClaimRatio < 0.5) return 'misleading'
    if (falseClaimRatio === 0 && verifiedCount > 0) return 'verified'
  }
  
  // If no fact-checks but high credibility from publisher, classify as verified
  if (credibilityScore >= 0.85 && mbfcMatch && mbfcMatch.mbfc_factuality_score >= 0.8) {
    return 'verified'
  }
  
  // If moderate-high credibility, still unverified (needs fact-checks to confirm)
  return 'unverified'
}
