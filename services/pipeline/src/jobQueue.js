const jobs = new Map()
let counter = 1

export function enqueue(article, processor) {
  const id = `job-${Date.now()}-${counter++}`
  jobs.set(id, { id, status: 'queued', article, result: null })
  // process async
  ;(async () => {
    jobs.get(id).status = 'processing'
    try {
      const res = await processor(article)
      jobs.get(id).status = 'finished'
      jobs.get(id).result = res
    } catch (err) {
      jobs.get(id).status = 'failed'
      jobs.get(id).result = { error: err?.message || 'error' }
    }
  })()
  return id
}

export function getJob(id) {
  return jobs.get(id) || null
}
