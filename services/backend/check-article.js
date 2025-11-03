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
