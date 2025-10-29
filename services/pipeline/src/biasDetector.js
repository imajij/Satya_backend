import axios from 'axios'
import { HUGGINGFACE_API_KEY } from './config.js'
import { sentenceSplitter } from './utils.js'

async function callHf(sentences) {
  if (!HUGGINGFACE_API_KEY) {
    console.log('[biasDetector] No API key, using fallback')
    return sentences.map(s => ({ sentence: s, biased: false, modelScore: 0 }))
  }
  
  try {
    // Using valurank/distilroberta-bias - a working alternative to d4data
    // This model returns: [{ label: "BIASED" | "NEUTRAL", score: 0-1 }]
    const url = 'https://api-inference.huggingface.co/models/valurank/distilroberta-bias'
    console.log(`[biasDetector] Calling HuggingFace API for ${sentences.length} sentences...`)
    
    const res = await axios.post(
      url,
      { inputs: sentences },
      {
        headers: { Authorization: `Bearer ${HUGGINGFACE_API_KEY}` },
        timeout: 30000
      }
    )
    
    const data = res?.data
    console.log('[biasDetector] Got response from HuggingFace')
    
    if (!data) {
      console.log('[biasDetector] Empty response, using fallback')
      return sentences.map(s => ({ sentence: s, biased: false, modelScore: 0 }))
    }
    
    // Parse the response format: [[{label, score}, ...], ...]
    if (Array.isArray(data)) {
      return data.map((result, i) => {
        // result is array of [{label: "BIASED", score: 0.84}, {label: "NEUTRAL", score: 0.16}]
        const biasedResult = Array.isArray(result) ? result.find(r => r.label === 'BIASED') : null
        const biasScore = biasedResult ? biasedResult.score : 0
        return {
          sentence: sentences[i],
          biased: biasScore > 0.5, // Consider biased if confidence > 50%
          modelScore: biasScore
        }
      })
    }
    
    console.log('[biasDetector] Unexpected response format, using fallback')
    return sentences.map(s => ({ sentence: s, biased: false, modelScore: 0 }))
  } catch (err) {
    console.error('[biasDetector] HuggingFace API error:', err.message)
    return sentences.map(s => ({ sentence: s, biased: false, modelScore: 0 }))
  }
}

export async function detectBias(article) {
  const sents = sentenceSplitter(article.content || '')
  const batches = []
  const BATCH = 16
  for (let i = 0; i < sents.length; i += BATCH) batches.push(sents.slice(i, i + BATCH))
  
  const results = []
  for (const b of batches) {
    const r = await callHf(b)
    results.push(...r)
  }
  
  const flagged = results.filter(r => r.biased)
  const biasMagnitude = results.length ? flagged.length / results.length : 0
  
  console.log(`[biasDetector] Analyzed ${results.length} sentences, ${flagged.length} flagged as biased (${(biasMagnitude * 100).toFixed(1)}%)`)
  
  return { biasMagnitude, biasDirection: null, sentence_level_scores: results }
}
