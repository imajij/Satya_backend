import express from 'express'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'
import { router as apiRouter } from './src/apiRoutes.js'
import { APP_MOTTO } from './src/config.js'

dotenv.config()

const app = express()
app.use(bodyParser.json({ limit: '200kb' }))

app.get('/', (req, res) => {
  res.json({ ok: true, motto: APP_MOTTO })
})

app.use('/api', apiRouter)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`satya pipeline running on http://localhost:${PORT} — ${APP_MOTTO}`))
