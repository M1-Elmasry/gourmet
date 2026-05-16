import { initDb } from '../backend/src/db/client'
import app from '../backend/src/index'
import type { IncomingMessage, ServerResponse } from 'http'

let dbReady = false
const ensureDb = async () => {
  if (!dbReady) {
    await initDb()
    dbReady = true
  }
}

export const config = {
  runtime: 'nodejs',
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await ensureDb()

  const host = (req.headers['x-forwarded-host'] || req.headers.host || 'localhost') as string
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
  const url = new URL(req.url || '/', `${proto}://${host}`)

  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) headers.set(k, v.join(', '))
    else if (typeof v === 'string') headers.set(k, v)
  }

  const method = req.method || 'GET'
  const hasBody = method !== 'GET' && method !== 'HEAD'
  const body = hasBody ? await readBody(req) : undefined

  const webReq = new Request(url.toString(), {
    method,
    headers,
    body: body && body.length > 0 ? body : undefined,
  })

  const response = await app.fetch(webReq)

  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })

  const buf = Buffer.from(await response.arrayBuffer())
  res.end(buf)
}
