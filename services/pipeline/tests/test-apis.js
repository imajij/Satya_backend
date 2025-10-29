import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

// Test HuggingFace Bias Detection - Single String
console.log('=== Testing HuggingFace Bias Detection (Single String) ===')
const hfKey = process.env.HUGGINGFACE_API_KEY || 'your_key_here'
const testSentence = 'The government completely failed its citizens.'

try {
  const res = await axios.post(
    'https://api-inference.huggingface.co/models/d4data/bias-detection-model',
    { inputs: testSentence },
    {
      headers: { Authorization: `Bearer ${hfKey}` },
      timeout: 15000
    }
  )
  console.log('HuggingFace Response (single):', JSON.stringify(res.data, null, 2))
} catch (e) {
  console.error('HuggingFace Error (single):', e.response?.data || e.message)
}

// Test HuggingFace - Array format
console.log('\n=== Testing HuggingFace Bias Detection (Array) ===')
const testSentences = [
  'The government completely failed its citizens.',
  'The stock market closed at 15000 points today.'
]

try {
  const res = await axios.post(
    'https://api-inference.huggingface.co/models/d4data/bias-detection-model',
    { inputs: testSentences },
    {
      headers: { Authorization: `Bearer ${hfKey}` },
      timeout: 15000
    }
  )
  console.log('HuggingFace Response (array):', JSON.stringify(res.data, null, 2))
} catch (e) {
  console.error('HuggingFace Error (array):', e.response?.data || e.message)
}

// Test Gemini
console.log('\n=== Testing Gemini API ===')
const geminiKey = 'AIzaSyC58HlQ0XJoQgiVucexKad9zz44z0ENbIo'
const testText = 'Israeli Prime Minister Benjamin Netanyahu ordered the Israeli forces to immediately carry out powerful strikes in Gaza amid heightened tensions.'

try {
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${geminiKey}`
  const payload = {
    contents: [{
      parts: [{
        text: `Extract 3-5 factual claims from this text that can be fact-checked. Return ONLY a JSON array of strings, nothing else. Text: ${testText}`
      }]
    }]
  }
  
  const res = await axios.post(url, payload, { timeout: 15000 })
  const text = res?.data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  console.log('Gemini Response:', text)
  
  // Try to extract JSON
  const jsonMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) || text.match(/(\[[\s\S]*?\])/)
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[1])
    console.log('Extracted claims:', parsed)
  }
} catch (e) {
  console.error('Gemini Error:', e.response?.data || e.message)
}

// Test Google Fact Check
console.log('\n=== Testing Google Fact Check API ===')
const gfcKey = 'AIzaSyBC7umrAuKadLGedwWd7TQVta1hkhkOlSg'
const testClaim = 'Benjamin Netanyahu is Prime Minister of Israel'

try {
  const res = await axios.get(
    'https://factchecktools.googleapis.com/v1alpha1/claims:search',
    {
      params: {
        key: gfcKey,
        query: testClaim,
        languageCode: 'en'
      },
      timeout: 10000
    }
  )
  console.log('Google Fact Check Response:', JSON.stringify(res.data, null, 2))
} catch (e) {
  console.error('Google Fact Check Error:', e.response?.data || e.message)
}
