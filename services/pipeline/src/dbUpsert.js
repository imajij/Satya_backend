import { getDb } from './mongoClient.js'

export async function upsertProcessed(processed) {
  const db = await getDb(process.env.MONGO_DB || 'satya')
  if (!db) return null
  
  // Map processed pipeline output to backend Article schema
  const articleDoc = {
    headline: processed.title || processed.headline || '',
    publisher: processed.publisher || '',
    content: processed.content || '',
    url: processed.url || '',
    // Convert scores: factual is 0-100, bias is string enum
    factual: processed.credibilityScore ? Math.round(processed.credibilityScore * 100) : null,
    bias: processed.articleBiasScore > 0.1 ? 'right' : processed.articleBiasScore < -0.1 ? 'left' : 'neutral',
    classification: processed.classification || 'unverified',
    updatedAt: new Date()
  }

  // Upsert into articles collection (NOT processed_articles)
  const coll = db.collection('articles')
  const filter = { url: articleDoc.url }
  const res = await coll.updateOne(filter, { $set: articleDoc }, { upsert: true })
  return res
}
