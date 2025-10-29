import dotenv from 'dotenv'
dotenv.config()

export const MONGO_URI = process.env.MONGO_URI || ''
export const MONGO_DB = process.env.MONGO_DB || 'satya'
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1'
export const GOOGLE_FACTCHECK_API_KEY = process.env.GOOGLE_FACTCHECK_API_KEY || ''
export const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || ''
export const PORT = process.env.PORT || 3000
export const BIAS_PENALTY_FACTOR = parseFloat(process.env.BIAS_PENALTY_FACTOR || '0.5')
export const DEFAULT_PUBLISHER_FACTUALITY = parseFloat(process.env.DEFAULT_PUBLISHER_FACTUALITY || '0.6')
export const FUZZY_MATCH_THRESHOLD = parseFloat(process.env.FUZZY_MATCH_THRESHOLD || '0.7')
export const APP_MOTTO = process.env.APP_MOTTO || 'Trustworthy news and viral message filter'
