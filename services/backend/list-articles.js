import mongoose from 'mongoose';
import Article from './src/models/Article.js';

const MONGO_URI = 'mongodb+srv://satya:7WhUBPmXdJ1L24Mb@satya0.1wzg9zg.mongodb.net/satya?appName=satya0';

mongoose.connect(MONGO_URI).then(async () => {
  console.log('Connected to database:', mongoose.connection.name);
  
  // List all collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('\n=== Available Collections ===');
  collections.forEach(c => console.log('-', c.name));
  
  // Count documents in articles collection
  const count = await Article.countDocuments();
  console.log('\n=== Articles Collection ===');
  console.log('Total articles:', count);
  
  if (count > 0) {
    // Get first few articles with just _id and headline
    const articles = await Article.find({}).limit(3).select('_id headline publisher url').lean();
    console.log('\n=== Sample Articles ===');
    articles.forEach(a => {
      console.log(`\nID: ${a._id}`);
      console.log(`Headline: ${a.headline}`);
      console.log(`Publisher: ${a.publisher}`);
      console.log(`URL: ${a.url}`);
    });
  }
  
  process.exit(0);
}).catch(err => {
  console.error('MongoDB Error:', err.message);
  process.exit(1);
});
