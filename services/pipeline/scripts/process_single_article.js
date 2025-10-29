import path from 'path'
import fs from 'fs'
import { processArticle } from '../src/processor.js'

async function main() {
  const p = process.argv[2]
  if (!p) { console.error('Usage: node process_single_article.js <path-to-article.json>'); process.exit(1) }
  const full = path.resolve(process.cwd(), p)
  if (!fs.existsSync(full)) { console.error('File not found:', full); process.exit(1) }
  const article = JSON.parse(fs.readFileSync(full,'utf-8'))
  const out = await processArticle(article)
  console.log(JSON.stringify(out, null, 2))
}

if (require.main === module) main()
