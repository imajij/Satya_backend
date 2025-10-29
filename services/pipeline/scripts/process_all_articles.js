import fs from 'fs'
import path from 'path'
import { processArticle } from '../src/processor.js'

async function main() {
  const dir = path.resolve(process.cwd(), 'articles')
  if (!fs.existsSync(dir)) {
    console.error('No articles directory found')
    process.exit(1)
  }
  const files = fs.readdirSync(dir).filter(f=>f.endsWith('.json'))
  for (const f of files) {
    try {
      const p = path.join(dir, f)
      const article = JSON.parse(fs.readFileSync(p,'utf-8'))
      const out = await processArticle(article)
      console.log('Processed', f, '->', out.classification)
    } catch (err) { console.error('Failed', f, err.message) }
  }
}

if (require.main === module) main()
