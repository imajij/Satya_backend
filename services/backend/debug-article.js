import mongoose from 'mongoose';
import Article from './src/models/Article.js';

const MONGO_URI = 'mongodb+srv://satya:7WhUBPmXdJ1L24Mb@satya0.1wzg9zg.mongodb.net/satya?appName=satya0';

mongoose.connect(MONGO_URI).then(async () => {
  console.log('Connected to database:', mongoose.connection.name);
  
  // Get the BBC Sport article (Paris Masters)
  const article = await Article.findOne({ publisher: 'BBC Sport' }).lean();
  
  if (article) {
    console.log('\n=== BBC Sport Article (Raw DB Data) ===');
    console.log('ID:', article._id);
    console.log('Headline:', article.headline);
    console.log('Publisher:', article.publisher);
    console.log('Classification:', article.classification);
    console.log('Factual:', article.factual);
    console.log('Bias:', article.bias);
    console.log('\nMBFC Publisher Match:');
    console.log(JSON.stringify(article.mbfc_publisher_match, null, 2));
    console.log('\nBias Analysis:');
    console.log(JSON.stringify(article.bias_analysis, null, 2));
  }
  
  // Get a few more articles
  console.log('\n\n=== All Articles Summary ===');
  const allArticles = await Article.find({}).select('_id headline publisher classification factual bias mbfc_publisher_match').lean();
  
  allArticles.forEach(a => {
    console.log('\n---');
    console.log('Publisher:', a.publisher);
    console.log('Classification:', a.classification);
    console.log('Factual:', a.factual);
    console.log('Bias (article field):', a.bias);
    console.log('Has MBFC Match:', !!a.mbfc_publisher_match);
    if (a.mbfc_publisher_match) {
      console.log('MBFC Factual:', a.mbfc_publisher_match.factual);
      console.log('MBFC Bias:', a.mbfc_publisher_match.bias);
    }
  });
  
  process.exit(0);
}).catch(err => {
  console.error('MongoDB Error:', err.message);
  process.exit(1);
});
