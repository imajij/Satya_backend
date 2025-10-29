import Fuse from 'fuse.js'
import { getDb } from './mongoClient.js'
import { FUZZY_MATCH_THRESHOLD } from './config.js'

export async function findPublisherMatch(publisherName, articleUrl) {
  console.log('[publisherLookup] Called with:', { publisherName, articleUrl })
  const db = await getDb(process.env.MONGO_DB || 'satya')
  if (!db) return { match: null }
  const coll = db.collection('media_bias_publishers')
  // MBFC docs have: publisher (string), url (string), bias (float -1 to 1), factual (float 0 to 1)
  const raw = await coll.find({}, { projection: { _id: 0, publisher: 1, url: 1, bias: 1, factual: 1 } }).toArray()
  if (!raw || raw.length === 0) {
    console.log('[publisherLookup] No MBFC data found')
    return { match: null }
  }
  console.log(`[publisherLookup] Loaded ${raw.length} MBFC publishers`)

  // First try exact domain match (most reliable) if we have a URL
  if (articleUrl) {
    try {
      const urlObj = new URL(articleUrl.startsWith('http') ? articleUrl : `https://${articleUrl}`)
      const hostname = urlObj.hostname.replace(/^www\./, '')
      console.log('[publisherLookup] Trying exact domain match for:', hostname)
      const exactMatch = raw.find(r => {
        const rUrl = (r.url || '').replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
        return rUrl === hostname || hostname.includes(rUrl) || rUrl.includes(hostname)
      })
      if (exactMatch) {
        console.log('[publisherLookup] exact domain match:', exactMatch.publisher)
        return {
          match: {
            name: exactMatch.publisher,
            domain: exactMatch.url,
            mbfc_bias_score: exactMatch.bias,
            mbfc_factuality_score: exactMatch.factual,
            matchScore: 1.0
          }
        }
      }
    } catch (e) {
      console.log('[publisherLookup] URL parsing failed:', e.message)
      // not a valid URL, continue to fuzzy
    }
  }

  // Fuzzy search on publisher name if provided
  if (publisherName) {
    const all = raw.map(r => ({
      publisher: r.publisher || '',
      url: r.url || '',
      bias: r.bias,
      factual: r.factual
    }))
    const fuse = new Fuse(all, { keys: ['publisher'], threshold: 0.4 })
    const res = fuse.search(publisherName)
    
    console.log('[publisherLookup] Fuzzy search for:', publisherName, '- found', res.length, 'results')
    if (res && res.length > 0) {
      const best = res[0]
      const matchScore = 1 - best.score
      console.log('[publisherLookup] Best fuzzy match:', best.item.publisher, 'score:', matchScore, 'threshold:', FUZZY_MATCH_THRESHOLD)
      if (matchScore >= FUZZY_MATCH_THRESHOLD) {
        return {
          match: {
            name: best.item.publisher,
            domain: best.item.url,
            mbfc_bias_score: best.item.bias,
            mbfc_factuality_score: best.item.factual,
            matchScore
          }
        }
      }
    }
  }

  console.log('[publisherLookup] no match found for publisherName:', publisherName, 'articleUrl:', articleUrl)
  return { match: null }
}
