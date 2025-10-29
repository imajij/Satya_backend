import express from 'express'
import { enqueue, getJob } from './jobQueue.js'
import { processArticle } from './processor.js'
import { ensureDir, genUuid, writeJsonFile } from './utils.js'
import path from 'path'
import fs from 'fs'
import { APP_MOTTO } from './config.js'
import axios from 'axios'

export const router = express.Router()

const NEWS_SCRAPER_URL = process.env.NEWS_SCRAPER_URL || 'http://localhost:5000'

router.post('/verify', async (req, res) => {
  const { article, url } = req.body || {}

  let articleObj = article

  // If url provided but not article, call the News Scraper service to scrape it
  if (!articleObj && url) {
    try {
      console.log(`[pipeline] calling News Scraper to scrape URL: ${url}`)
      
      const scraperResponse = await axios.post(
        `${NEWS_SCRAPER_URL}/api/news/scrape-url`,
        { url, saveToDb: true },
        { timeout: 15000 }
      )

      if (scraperResponse.data && scraperResponse.data.status === 'success') {
        const scrapedData = scraperResponse.data.data
        articleObj = {
          publisher: scrapedData.publisher,
          title: scrapedData.headline,
          content: scrapedData.content,
          url: scrapedData.url
        }
        console.log(`[pipeline] successfully scraped article: ${articleObj.title?.slice(0, 50)}...`)
      } else {
        throw new Error('News Scraper returned invalid response')
      }
    } catch (err) {
      console.warn('[pipeline] News Scraper failed, falling back to basic extraction:', err?.message || err)
      
      // Fallback to basic HTML extraction if News Scraper fails
      try {
        const r = await axios.get(url, { timeout: 10000 })
        const html = r.data
        // Quick-and-dirty extraction: og tags, title, and paragraphs
        const metaSite = html.match(/<meta[^>]+property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)
        const metaPublisher = html.match(/<meta[^>]+name=["']publisher["'][^>]*content=["']([^"']+)["']/i)
        const metaTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
        const titleTag = html.match(/<title>([^<]+)<\/title>/i)
        const metaDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["']/i)

        const publisher = (metaSite && metaSite[1]) || (metaPublisher && metaPublisher[1]) || null
        const title = (metaTitle && metaTitle[1]) || (titleTag && titleTag[1]) || ''

        // paragraph collection from article tag or all <p>
        let content = ''
        const articleMatch = html.match(/<article[\s\S]*?>[\s\S]*?<\/article>/i)
        const bodyToScan = articleMatch ? articleMatch[0] : html
        const pMatches = Array.from(bodyToScan.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)).map(m => m[1].replace(/<[^>]+>/g,'').trim()).filter(Boolean)
        content = pMatches.join('\n\n')

        articleObj = { publisher: publisher || (new URL(url)).hostname.replace('www.',''), title: title.trim(), content: content.slice(0, 20000), url }
      } catch (fallbackErr) {
        console.error('[pipeline] fallback extraction also failed:', fallbackErr?.message || fallbackErr)
        return res.status(502).json({ error: 'Failed to fetch and scrape url', motto: APP_MOTTO })
      }
    }
  }

  if (!articleObj) return res.status(400).json({ error: 'Provide article object in body or url', motto: APP_MOTTO })

  // Save article file
  const id = articleObj.articleId || genUuid()
  const articlesDir = path.resolve(process.cwd(), 'articles')
  ensureDir(articlesDir)
  const filePath = path.join(articlesDir, `${id}.json`)
  writeJsonFile(filePath, articleObj)

  // Enqueue processing
  const jobId = enqueue(articleObj, processArticle)
  res.json({ jobId, motto: APP_MOTTO, message: 'Article enqueued for processing. Use /status/:jobId to poll.' })
})

router.get('/status/:jobId', (req, res) => {
  const j = getJob(req.params.jobId)
  if (!j) return res.status(404).json({ error: 'job not found', motto: APP_MOTTO })
  res.json({ id: j.id, status: j.status, result: j.result, motto: APP_MOTTO })
})

router.get('/articles/processed', async (req, res) => {
  // If Mongo configured, return paginated results; else list files from ./processed
  try {
    const processedDir = path.resolve(process.cwd(), 'processed')
    ensureDir(processedDir)
    const files = fs.readdirSync(processedDir).filter(f => f.endsWith('.json'))
    const items = files.map(f => JSON.parse(fs.readFileSync(path.join(processedDir, f), 'utf-8')))
    res.json({ items, motto: APP_MOTTO })
  } catch (err) {
    res.status(500).json({ error: err.message, motto: APP_MOTTO })
  }
})
