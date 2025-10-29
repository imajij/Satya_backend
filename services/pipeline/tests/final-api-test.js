import axios from 'axios'

console.log('╔════════════════════════════════════════════════════════════════╗')
console.log('║         SATYA PIPELINE API INTEGRATION TEST                    ║')
console.log('╚════════════════════════════════════════════════════════════════╝\n')

const results = {
  gemini: '❌',
  factCheck: '❌',
  huggingFace: '❌',
  mbfc: '❌'
}

// Test 1: Gemini API
console.log('1️⃣  Testing Gemini API (Claim Extraction)...')
try {
  const geminiKey = 'AIzaSyC58HlQ0XJoQgiVucexKad9zz44z0ENbIo'
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${geminiKey}`
  const payload = {
    contents: [{
      parts: [{
        text: 'Extract 3 factual claims from this text. Return ONLY a JSON array. Text: Israeli Prime Minister Benjamin Netanyahu ordered strikes in Gaza.'
      }]
    }]
  }
  
  const res = await axios.post(url, payload, { timeout: 15000 })
  const text = res?.data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const jsonMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) || text.match(/(\[[\s\S]*?\])/)
  
  if (jsonMatch) {
    const claims = JSON.parse(jsonMatch[1])
    console.log('   ✅ PASS - Extracted', claims.length, 'claims')
    console.log('   Example:', claims[0])
    results.gemini = '✅'
  } else {
    console.log('   ⚠️  PARTIAL - Response received but could not parse JSON')
  }
} catch (e) {
  console.log('   ❌ FAIL -', e.response?.data?.error?.message || e.message)
}

// Test 2: Google Fact Check API
console.log('\n2️⃣  Testing Google Fact Check API...')
try {
  const gfcKey = 'AIzaSyBC7umrAuKadLGedwWd7TQVta1hkhkOlSg'
  const res = await axios.get(
    'https://factchecktools.googleapis.com/v1alpha1/claims:search',
    {
      params: {
        key: gfcKey,
        query: 'COVID-19 vaccines',
        languageCode: 'en'
      },
      timeout: 10000
    }
  )
  
  const claims = res.data?.claims || []
  console.log('   ✅ PASS - Found', claims.length, 'fact-check results')
  results.factCheck = '✅'
} catch (e) {
  const error = e.response?.data?.error
  if (error?.code === 403) {
    console.log('   ❌ FAIL - API not enabled')
    console.log('   📝 Action needed: Enable at', error.message.match(/https:\/\/[^\s]+/)?.[0])
  } else {
    console.log('   ❌ FAIL -', error?.message || e.message)
  }
}

// Test 3: HuggingFace Bias Detection
console.log('\n3️⃣  Testing HuggingFace Bias Detection...')
try {
  const hfToken = process.env.HUGGINGFACE_API_KEY || 'your_key_here'
  const res = await axios.post(
    'https://api-inference.huggingface.co/models/valurank/distilroberta-bias',
    { inputs: 'The government completely failed its citizens.' },
    {
      headers: { Authorization: `Bearer ${hfToken}` },
      timeout: 15000
    }
  )
  
  const result = res.data?.[0]?.[0]
  if (result?.label) {
    console.log('   ✅ PASS - Model returned:', result.label, `(${(result.score * 100).toFixed(1)}%)`)
    results.huggingFace = '✅'
  }
} catch (e) {
  console.log('   ❌ FAIL -', e.response?.data?.error || e.message)
}

// Test 4: MongoDB MBFC Publisher Lookup
console.log('\n4️⃣  Testing MongoDB MBFC Connection...')
try {
  const { MongoClient } = await import('mongodb')
  const uri = 'mongodb+srv://satya:7WhUBPmXdJ1L24Mb@satya0.1wzg9zg.mongodb.net/?appName=satya0'
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db('satya')
  
  const count = await db.collection('media_bias_publishers').countDocuments()
  const sample = await db.collection('media_bias_publishers').findOne({ publisher: /hindustan/i })
  
  await client.close()
  
  console.log('   ✅ PASS - Found', count, 'MBFC publishers')
  if (sample) {
    console.log('   Example:', sample.publisher, '- bias:', sample.bias, 'factual:', sample.factual)
  }
  results.mbfc = '✅'
} catch (e) {
  console.log('   ❌ FAIL -', e.message)
}

// Summary
console.log('\n╔════════════════════════════════════════════════════════════════╗')
console.log('║                       TEST RESULTS                              ║')
console.log('╚════════════════════════════════════════════════════════════════╝')
console.log(`   Gemini API (Claim Extraction):     ${results.gemini}`)
console.log(`   Google Fact Check API:             ${results.factCheck}`)
console.log(`   HuggingFace Bias Detection:        ${results.huggingFace}`)
console.log(`   MongoDB MBFC Connection:           ${results.mbfc}`)

const passCount = Object.values(results).filter(r => r === '✅').length
console.log(`\n   Overall: ${passCount}/4 tests passing`)

if (passCount === 4) {
  console.log('\n   🎉 All systems operational! Pipeline ready to process articles.')
} else {
  console.log('\n   ⚠️  Some APIs need attention. Pipeline will use fallbacks where needed.')
}
