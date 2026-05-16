import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { initDb } from './db/client'
import auth from './routes/auth'
import checkin from './routes/checkin'
import admin from './routes/admin'
import cron from './routes/cron'

const app = new Hono().basePath('/api')

app.use('*', cors({
  origin: process.env.FRONTEND_URL || '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

app.use('*', logger())

app.get('/health', (c) => c.json({ status: 'ok', ts: new Date().toISOString() }))

app.route('/auth', auth)
app.route('', checkin)
app.route('/admin', admin)
app.route('/cron', cron)

// Init DB on startup (local dev)
if (process.env.NODE_ENV !== 'production') {
  initDb().then(() => {
    console.log('DB initialized')
    serve({ fetch: app.fetch, port: 3001 }, () => {
      console.log('Backend running on http://localhost:3001')
    })
  })
}

export default app
