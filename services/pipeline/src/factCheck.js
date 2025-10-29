import axios from 'axios'
import { GOOGLE_FACTCHECK_API_KEY } from './config.js'

function mapTextualRating(r) {
  if (!r) return 'unverified'
  const s = r.toLowerCase()
  if (s.includes('false') || s.includes('pants on fire') || s.includes('no evidence')) return 'false'
  if (s.includes('true') || s.includes('mostly true') || s.includes('true-ish') || s.includes('correct')) return 'true'
  return 'unverified'
}

export async function factCheckClaim(claim) {
  // If API key missing, return no matches -> unverified
  if (!GOOGLE_FACTCHECK_API_KEY) return { claim, factcheck_matches: [], derivedVerdict: 'unverified' }
  try {
    const url = 'https://factchecktools.googleapis.com/v1alpha1/claims:search'
    const res = await axios.get(url, { params: { query: claim, key: GOOGLE_FACTCHECK_API_KEY }, timeout: 8000 })
    const items = res?.data?.claims || []
    const matches = (items || []).map(it => {
      const cr = it.claimReview?.[0]
      return {
        publisher: cr?.publisher?.name || it.claimant || null,
        url: cr?.url || it.url || null,
        textualRating: cr?.textualRating || cr?.title || null
      }
    })
    const derived = (matches[0] && mapTextualRating(matches[0].textualRating)) || 'unverified'
    return { claim, factcheck_matches: matches, derivedVerdict: derived }
  } catch (err) {
    return { claim, factcheck_matches: [], derivedVerdict: 'unverified' }
  }
}
