import { readJsonFile, writeJsonFile, slugify, genUuid, ensureDir, logNote } from './utils.js'
import { extractClaims } from './claimExtractor.js'
import { factCheckClaim } from './factCheck.js'
import { detectBias } from './biasDetector.js'
import { computeArticleBiasScore, computeCredibilityScore, classifyArticle } from './scoreCalculator.js'
import { findPublisherMatch } from './publisherLookup.js'
import { upsertProcessed } from './dbUpsert.js'
import path from 'path'
import { MONGO_DB } from './config.js'

const ARTICLES_DIR = path.resolve(process.cwd(), 'articles')
const PROCESSED_DIR = path.resolve(process.cwd(), 'processed')
ensureDir(PROCESSED_DIR)

export async function processArticle(articleInput) {
  const processed = { notes: [] }
  try {
    // load or use provided object
    const article = typeof articleInput === 'string' ? readJsonFile(articleInput) : articleInput
    processed.articleId = article.articleId || genUuid()
    processed.publisher = article.publisher || ''
    processed.title = article.title || ''
    processed.content = article.content || ''
    processed.url = article.url || ''
    processed.processingStatus = 'pending'

    // publisher lookup
    const { match } = await findPublisherMatch(processed.publisher, processed.url)
    processed.mbfc_publisher_match = match || null
    if (!match) logNote(processed, 'MBFC publisher not found')
    else logNote(processed, `Publisher matched: ${match.name} (score: ${match.matchScore})`)


    // extract claims
    const claims = await extractClaims(article)
    processed.claims = claims
    if (!claims || claims.length===0) logNote(processed, 'No claims extracted; using fallback')

    // fact-check claims
    const fcResults = []
    for (const c of claims) {
      const r = await factCheckClaim(c)
      fcResults.push(r)
    }
    processed.factcheck_results = fcResults
    const decisive = fcResults.filter(r=>r.derivedVerdict==='true' || r.derivedVerdict==='false')
    const falseCount = decisive.filter(r=>r.derivedVerdict==='false').length
    const verifiedCount = decisive.filter(r=>r.derivedVerdict==='true').length
    const checkedCount = decisive.length
    const falseClaimRatio = checkedCount ? falseCount / checkedCount : 0
    processed.falseClaimRatio = falseClaimRatio

    // bias detection
    const bias = await detectBias(article)
    processed.biasAnalysis = bias
    processed.articleBiasScore = computeArticleBiasScore(processed.mbfc_publisher_match, bias.biasMagnitude)

    // credibility
    processed.credibilityScore = computeCredibilityScore(processed.mbfc_publisher_match, falseClaimRatio, bias.biasMagnitude)

    // classification - now considers credibility for high-reputation publishers
    processed.classification = classifyArticle(checkedCount, falseClaimRatio, verifiedCount, processed.credibilityScore, processed.mbfc_publisher_match)
    processed.processingStatus = 'success'
    processed.processedAt = new Date().toISOString()

    // write processed file
    const name = slugify(processed.articleId || processed.title || processed.url || String(Date.now()))
    const outPath = path.join(PROCESSED_DIR, `${name}.processed.json`)
    writeJsonFile(outPath, processed)

    // upsert to db if possible
    try { await upsertProcessed(processed) } catch(e) { logNote(processed, `DB upsert failed: ${e.message}`) }

    return processed
  } catch (err) {
    logNote(processed, `Processing error: ${err?.message || String(err)}`)
    processed.processingStatus = 'failed'
    processed.processedAt = new Date().toISOString()
    return processed
  }
}
