import mongoose from 'mongoose';
import Article from './src/models/Article.js';

const MONGO_URI = 'mongodb+srv://satya:7WhUBPmXdJ1L24Mb@satya0.1wzg9zg.mongodb.net/satya?retryWrites=true&w=majority';

// Simulate the userService.js mapping function
function mapBackendArticle(backendArticle) {
  const verdictMap = {
    'verified': 'True',
    'misleading': 'Misleading',
    'fake': 'Fake',
    'unverified': 'Unverified',
  };
  
  // Calculate source reputation from MBFC data
  let sourceReputation = 50;
  let publisherBiasScore = 0;
  
  if (backendArticle.mbfc_publisher_match) {
    const mbfc = backendArticle.mbfc_publisher_match;
    
    let factualScore = 0.5;
    let biasValue = 0;
    
    if (typeof mbfc.mbfc_factuality_score === 'number') {
      factualScore = mbfc.mbfc_factuality_score;
    } else if (typeof mbfc.factual === 'number') {
      factualScore = mbfc.factual > 1 ? mbfc.factual / 100 : mbfc.factual;
    }
    
    if (typeof mbfc.mbfc_bias_score === 'number') {
      biasValue = mbfc.mbfc_bias_score;
    } else if (typeof mbfc.bias === 'number') {
      biasValue = mbfc.bias;
    }
    
    const biasAdjustment = 1 - Math.abs(biasValue);
    sourceReputation = Math.round(((biasAdjustment + factualScore) / 2) * 100);
    publisherBiasScore = Math.round(Math.abs(biasValue) * 100);
  }
  
  const credibilityScore = typeof backendArticle.factual === 'number' 
    ? Math.round(backendArticle.factual) 
    : sourceReputation;
  
  let articleBiasScore = publisherBiasScore;
  
  if (typeof backendArticle.articleBiasScore === 'number' && Math.abs(backendArticle.articleBiasScore) > 0.05) {
    articleBiasScore = Math.round(Math.abs(backendArticle.articleBiasScore) * 100);
  } else if (backendArticle.bias_analysis?.biasMagnitude !== undefined && Math.abs(backendArticle.bias_analysis.biasMagnitude) > 0.05) {
    articleBiasScore = Math.round(Math.abs(backendArticle.bias_analysis.biasMagnitude) * 100);
  }
  
  let biasDirection = 'Neutral';
  if (backendArticle.bias) {
    biasDirection = backendArticle.bias.charAt(0).toUpperCase() + backendArticle.bias.slice(1);
  } else if (backendArticle.bias_analysis?.biasDirection) {
    biasDirection = backendArticle.bias_analysis.biasDirection.charAt(0).toUpperCase() + backendArticle.bias_analysis.biasDirection.slice(1);
  }
  
  return {
    id: backendArticle._id,
    headline: backendArticle.headline,
    summary: backendArticle.content?.substring(0, 200) + '...' || '',
    content: backendArticle.content,
    source: backendArticle.publisher,
    credibilityScore,
    verdict: verdictMap[backendArticle.classification] || 'Unverified',
    bias: biasDirection,
    biasScore: articleBiasScore,
    sourceReputation,
  };
}

mongoose.connect(MONGO_URI).then(async () => {
  const article = await Article.findOne({ classification: 'verified' }).sort({ createdAt: -1 });
  
  if (article) {
    console.log('=== Raw Database Article ===');
    console.log(JSON.stringify(article.toObject(), null, 2));
    
    console.log('\n=== After userService Mapping ===');
    const mapped = mapBackendArticle(article.toObject());
    console.log(JSON.stringify(mapped, null, 2));
    
    console.log('\n=== Expected Card Display ===');
    console.log('Publisher:', mapped.source);
    console.log('Reputation:', mapped.sourceReputation, '/ 100');
    console.log('Classification:', mapped.verdict);
    console.log('Credibility:', mapped.credibilityScore, '%');
    console.log('Bias Direction:', mapped.bias);
    console.log('Bias Score:', mapped.biasScore, '%');
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
