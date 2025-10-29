import { MongoClient } from 'mongodb'
import { MONGO_URI } from './config.js'

let client
export async function getMongoClient() {
  if (!MONGO_URI) return null
  if (client) return client
  client = new MongoClient(MONGO_URI)
  await client.connect()
  return client
}

export async function getDb(dbName) {
  const c = await getMongoClient()
  if (!c) return null
  return c.db(dbName)
}
