import { handle } from 'hono/vercel'
import { initDb } from '../backend/src/db/client'
import app from '../backend/src/index'

// Initialize DB on cold start
let dbReady = false
const ensureDb = async () => {
  if (!dbReady) {
    await initDb()
    dbReady = true
  }
}

export const config = {
  runtime: 'nodejs20.x',
}

export default async function handler(req: Request) {
  await ensureDb()
  return handle(app)(req)
}
