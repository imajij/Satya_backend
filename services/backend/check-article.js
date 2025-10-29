import mongoose from 'mongoose';
import Article from './src/models/Article.js';

const MONGO_URI = 'mongodb+srv://satya:7WhUBPmXdJ1L24Mb@satya0.1wzg9zg.mongodb.net/?appName=satya0';

mongoose.connect(MONGO_URI).then(async () => {
  
  // Get ONE article to see FULL data
  const article = await Article.findOne({}).sort({ createdAt: -1 });
  
  if (article) {
    console.log('\n=== Full Article Data ===\n');
    console.log(JSON.stringify(article.toObject(), null, 2));
  } else {
    console.log('No articles found');
  }
  
  process.exit(0);
}).catch(err => {
  console.error('MongoDB Error:', err.message);
  process.exit(1);
});
