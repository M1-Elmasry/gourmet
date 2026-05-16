/**
 * server.ts — used ONLY for Docker/self-hosted deployment.
 * Serves the Hono API at /api/* AND the static Vite build from /public.
 * Not used on Vercel (Vercel uses api/index.ts as the serverless function).
 */
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { initDb } from './db/client'
import auth from './routes/auth'
import checkin from './routes/checkin'
import admin from './routes/admin'
import cron from './routes/cron'

const app = new Hono()

app.use('*', cors())
app.use('*', logger())

// API routes
const api = new Hono().basePath('/api')
api.get('/health', (c) => c.json({ status: 'ok' }))
api.route('/auth', auth)
api.route('', checkin)
api.route('/admin', admin)
api.route('/cron', cron)

app.route('/', api)

// Serve static frontend
app.use('/*', serveStatic({ root: './public' }))

// SPA fallback — all non-API routes serve index.html
app.get('*', serveStatic({ path: './public/index.html' }))

const PORT = Number(process.env.PORT) || 3001

initDb()
  .then(() => {
    console.log('✅ Database initialized')
    serve({ fetch: app.fetch, port: PORT }, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('❌ DB init failed:', err)
    process.exit(1)
  })
