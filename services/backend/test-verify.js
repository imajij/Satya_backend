import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Article from './src/models/Article.js';

dotenv.config();

const appendDbToUri = (uri, dbName) => {
  if (!uri) return '';
  const normalised = uri.replace(/^mongodb(\+srv)?:\/\//, '');
  const hasDbPath = /\/[^\/\?]+/.test(normalised);
  if (hasDbPath || !dbName) return uri;

  const trimmed = uri.replace(/\/*$/, '');
  const queryIndex = trimmed.indexOf('?');
  if (queryIndex === -1) return `${trimmed}/${dbName}`;
  const base = trimmed.slice(0, queryIndex).replace(/\/*$/, '');
  const query = trimmed.slice(queryIndex);
  return `${base}/${dbName}${query}`;
};

const rawUri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB || 'satya';
const MONGO_URI = appendDbToUri(rawUri, dbName);

if (!MONGO_URI) {
  console.error('Mongo connection string is not configured. Set MONGO_URI (and optionally MONGO_DB).');
  process.exit(1);
}
const BACKEND_URL = 'http://localhost:4000';
const TEST_URL = 'https://www.indiatoday.in/elections/assembly/story/mahagathbandhan-bihar-poll-manifesto-tejashwi-pran-jobs-women-benefit-pension-crop-msp-waqf-law-toddy-2809724-2025-10-28';

async function testVerify() {
  try {
    console.log('🔍 Testing verification for:', TEST_URL);
    console.log('\n1. Calling backend /api/verify...');
    
    const response = await axios.post(`${BACKEND_URL}/api/verify`, {
      url: TEST_URL
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test' // You might need a real Clerk token
      }
    });
    
    console.log('\n✅ Backend response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Now check what's in MongoDB
    console.log('\n2. Checking MongoDB...');
    await mongoose.connect(MONGO_URI);
    
    const article = await Article.findOne({ url: TEST_URL });
    
    if (article) {
      console.log('\n✅ Article found in database:');
      console.log(JSON.stringify(article.toObject(), null, 2));
      
      console.log('\n📊 Key fields:');
      console.log('  Classification:', article.classification);
      console.log('  Factual Score:', article.factual);
      console.log('  Bias:', article.bias);
      console.log('  Claims:', article.claims?.length || 0, 'claims');
      console.log('  Fact Checks:', article.fact_check_results?.length || 0, 'results');
      console.log('  MBFC Match:', article.mbfc_publisher_match?.name || 'None');
      console.log('  Bias Analysis:', article.bias_analysis ? 'Present' : 'Missing');
    } else {
      console.log('\n❌ Article not found in database!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testVerify();
