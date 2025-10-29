import axios from 'axios'
import { GEMINI_API_KEY, GEMINI_MODEL } from './config.js'
import { sentenceSplitter } from './utils.js'

export async function extractClaims(article) {
  // Attempt to call Gemini API; if no key or failure, fallback
  if (!GEMINI_API_KEY) {
    console.log('[claimExtractor] No API key, using fallback')
    return fallbackClaims(article)
  }
  try {
    // Use real Gemini API - gemini-2.0-flash is available
    const model = 'gemini-2.0-flash'
    const prompt = `Extract 3-6 factual claims from this article that can be fact-checked. Return ONLY a JSON array of strings, nothing else.

Title: ${article.title || ''}

Content: ${(article.content || '').substring(0, 3000)}`
    
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_API_KEY}`
    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    }
    
    console.log('[claimExtractor] Calling Gemini API...')
    const res = await axios.post(url, payload, { timeout: 15000 })
    const text = res?.data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    console.log('[claimExtractor] Gemini response:', text.substring(0, 200))
    
    if (!text) return fallbackClaims(article)
    
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) || text.match(/(\[[\s\S]*?\])/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        if (Array.isArray(parsed)) {
          console.log('[claimExtractor] Extracted', parsed.length, 'claims from Gemini')
          return parsed.slice(0, 6).map(s => s.toString())
        }
      } catch (e) {
        console.log('[claimExtractor] JSON parse failed:', e.message)
      }
    }
    
    // fallback: split by lines
    const lines = text.split('\n').map(s => s.replace(/^[-*\d.]+\s*/, '').trim()).filter(Boolean)
    return lines.slice(0, 6)
  } catch (err) {
    console.error('[claimExtractor] Gemini API error:', err.message)
    return fallbackClaims(article)
  }
}

function fallbackClaims(article) {
  const sentences = sentenceSplitter(article.content || '')
  const claims = []
  if (article.title) claims.push(article.title)
  for (let i=0;i<2 && i<sentences.length;i++) claims.push(sentences[i])
  return claims
}
