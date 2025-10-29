import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const API_KEY = process.env.GOOGLE_FACTCHECK_API_KEY

console.log('╔════════════════════════════════════════════════════════════════╗')
console.log('║         GOOGLE FACT CHECK API - DETAILED TEST                  ║')
console.log('╚════════════════════════════════════════════════════════════════╝\n')

console.log('API Key loaded:', API_KEY ? `${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}` : '❌ NOT FOUND')
console.log('')

if (!API_KEY) {
  console.error('❌ GOOGLE_FACTCHECK_API_KEY not found in .env file')
  process.exit(1)
}

// Test 1: Simple query
console.log('Test 1: Simple fact-check query')
console.log('Query: "COVID-19 vaccines"')
console.log('URL: https://factchecktools.googleapis.com/v1alpha1/claims:search\n')

try {
  const response = await axios.get(
    'https://factchecktools.googleapis.com/v1alpha1/claims:search',
    {
      params: {
        key: API_KEY,
        query: 'COVID-19 vaccines',
        languageCode: 'en'
      },
      timeout: 10000
    }
  )
  
  console.log('✅ SUCCESS!')
  console.log('Status:', response.status)
  console.log('Response data:', JSON.stringify(response.data, null, 2))
  
  if (response.data.claims) {
    console.log(`\nFound ${response.data.claims.length} fact-check results`)
    response.data.claims.slice(0, 2).forEach((claim, i) => {
      console.log(`\nClaim ${i + 1}:`)
      console.log('  Text:', claim.text || claim.claimant)
      console.log('  Claimant:', claim.claimant)
      if (claim.claimReview && claim.claimReview[0]) {
        console.log('  Publisher:', claim.claimReview[0].publisher?.name)
        console.log('  Rating:', claim.claimReview[0].textualRating)
        console.log('  URL:', claim.claimReview[0].url)
      }
    })
  }
} catch (error) {
  console.log('❌ ERROR!')
  console.log('\n--- Full Error Object ---')
  console.log(JSON.stringify(error, null, 2))
  
  if (error.response) {
    console.log('\n--- Response Data ---')
    console.log('Status:', error.response.status)
    console.log('Status Text:', error.response.statusText)
    console.log('Headers:', JSON.stringify(error.response.headers, null, 2))
    console.log('Data:', JSON.stringify(error.response.data, null, 2))
    
    if (error.response.data?.error) {
      const err = error.response.data.error
      console.log('\n--- Error Details ---')
      console.log('Error Code:', err.code)
      console.log('Error Status:', err.status)
      console.log('Error Message:', err.message)
      
      if (err.details) {
        console.log('\nError Details:')
        err.details.forEach((detail, i) => {
          console.log(`  Detail ${i + 1}:`, JSON.stringify(detail, null, 2))
        })
      }
      
      // Parse specific error messages
      if (err.code === 403) {
        console.log('\n🔍 DIAGNOSIS: Permission Denied (403)')
        console.log('This means the API is not enabled for your project.')
        
        const urlMatch = err.message.match(/https:\/\/[^\s]+/)
        if (urlMatch) {
          console.log('\n📝 ACTION REQUIRED:')
          console.log('1. Visit:', urlMatch[0])
          console.log('2. Click the "Enable" button')
          console.log('3. Wait 2-3 minutes for changes to propagate')
          console.log('4. Run this test again')
        }
      } else if (err.code === 400) {
        console.log('\n🔍 DIAGNOSIS: Bad Request (400)')
        console.log('Check if the API key is valid and the query parameters are correct.')
      } else if (err.code === 429) {
        console.log('\n🔍 DIAGNOSIS: Rate Limit (429)')
        console.log('Too many requests. Wait a moment and try again.')
      }
    }
  } else if (error.request) {
    console.log('\n--- Request Made But No Response ---')
    console.log('Request:', error.request)
    console.log('\nThis usually means a network error or timeout.')
  } else {
    console.log('\n--- Error Setting Up Request ---')
    console.log('Message:', error.message)
  }
}

// Test 2: Different query
console.log('\n\n╔════════════════════════════════════════════════════════════════╗')
console.log('Test 2: Another query')
console.log('Query: "Climate change"')

try {
  const response = await axios.get(
    'https://factchecktools.googleapis.com/v1alpha1/claims:search',
    {
      params: {
        key: API_KEY,
        query: 'Climate change',
        languageCode: 'en',
        pageSize: 3
      },
      timeout: 10000
    }
  )
  
  console.log('✅ SUCCESS!')
  console.log(`Found ${response.data.claims?.length || 0} results`)
} catch (error) {
  console.log('❌ ERROR!')
  console.log('Error Code:', error.response?.data?.error?.code)
  console.log('Error Message:', error.response?.data?.error?.message)
}

console.log('\n╔════════════════════════════════════════════════════════════════╗')
console.log('║                       TEST COMPLETE                            ║')
console.log('╚════════════════════════════════════════════════════════════════╝')
