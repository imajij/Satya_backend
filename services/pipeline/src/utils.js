import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export const readJsonFile = (p) => JSON.parse(fs.readFileSync(p, 'utf-8'))
export const writeJsonFile = (p, obj) => fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf-8')
export const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
export const sentenceSplitter = (text) => {
  if (!text) return []
  // very simple splitter — good enough for demo
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}
export const genUuid = () => uuidv4()
export const logNote = (obj, note) => {
  if (!obj.notes) obj.notes = []
  obj.notes.push(note)
}

export const ensureDir = (p) => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}
