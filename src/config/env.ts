import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  MONGO_URI: string;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  NEWSDATA_API_KEY: string;
  MEDIASTACK_API_KEY: string;
  GOOGLE_FACTCHECK_API_KEY: string;
  AI_SERVICE_URL: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  INTERNAL_API_KEY: string;
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const config: EnvConfig = {
  PORT: parseInt(getEnv('PORT', '5000'), 10),
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  MONGO_URI: getEnv('MONGO_URI'),
  JWT_SECRET: getEnv('JWT_SECRET'),
  FRONTEND_URL: getEnv('FRONTEND_URL', 'http://localhost:5173'),
  NEWSDATA_API_KEY: getEnv('NEWSDATA_API_KEY'),
  MEDIASTACK_API_KEY: getEnv('MEDIASTACK_API_KEY'),
  GOOGLE_FACTCHECK_API_KEY: getEnv('GOOGLE_FACTCHECK_API_KEY'),
  AI_SERVICE_URL: getEnv('AI_SERVICE_URL'),
  ADMIN_EMAIL: getEnv('ADMIN_EMAIL'),
  ADMIN_PASSWORD: getEnv('ADMIN_PASSWORD'),
  INTERNAL_API_KEY: getEnv('INTERNAL_API_KEY'),
};
