import axios from 'axios';
import { config } from '../config/env';

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  category?: string;
  language?: string;
}

export const fetchNewsDataArticles = async (category?: string): Promise<NewsArticle[]> => {
  try {
    const response = await axios.get('https://newsdata.io/api/1/news', {
      params: {
        apikey: config.NEWSDATA_API_KEY,
        language: 'en',
        category: category || 'top',
      },
    });

    return response.data.results.map((article: any) => ({
      title: article.title,
      description: article.description || article.content,
      url: article.link,
      source: article.source_id,
      publishedAt: article.pubDate,
      category: article.category?.[0],
      language: article.language,
    }));
  } catch (error) {
    console.error('NewsData API error:', error);
    return [];
  }
};

export const fetchMediastackArticles = async (category?: string): Promise<NewsArticle[]> => {
  try {
    const response = await axios.get('http://api.mediastack.com/v1/news', {
      params: {
        access_key: config.MEDIASTACK_API_KEY,
        languages: 'en',
        categories: category || 'general',
        limit: 50,
      },
    });

    return response.data.data.map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      source: article.source,
      publishedAt: article.published_at,
      category: article.category,
      language: article.language,
    }));
  } catch (error) {
    console.error('Mediastack API error:', error);
    return [];
  }
};
