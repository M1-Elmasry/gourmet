import { Hono } from 'hono'
import { deleteImages } from '../lib/cloudinary'
import { sql } from '../db/client'

const cron = new Hono()

cron.get('/cleanup', async (c) => {
  const secret = c.req.header('Authorization')
  const cronSecret = process.env.CRON_SECRET

  // Allow Vercel cron (no auth header) OR manual trigger with secret
  if (cronSecret && secret && secret !== `Bearer ${cronSecret}`) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    // Get image URLs before deleting records
    const oldRecords = await sql`
      SELECT image_url FROM records
      WHERE created_at < NOW() - INTERVAL '48 hours'
      AND image_url IS NOT NULL
    `

    // Delete old blobs from Vercel Blob storage
    const urlsToDelete = oldRecords
      .map((r: any) => r.image_url)
      .filter(Boolean)

    let deletedImages = urlsToDelete.length
    if (urlsToDelete.length > 0) {
      try {
        deletedImages = await deleteImages(urlsToDelete)
      } catch (delErr) {
        console.warn('Image cleanup skipped:', (delErr as Error).message)
        deletedImages = 0
      }
    }

    // Delete old records from DB
    const deleted = await sql`
      DELETE FROM records
      WHERE created_at < NOW() - INTERVAL '48 hours'
      RETURNING id
    `

    console.log(`Cleanup: deleted ${deleted.length} records, ${deletedImages} images`)

    return c.json({
      success: true,
      deletedRecords: deleted.length,
      deletedImages,
    })
  } catch (err) {
    console.error('Cleanup error:', err)
    return c.json({ error: 'Cleanup failed' }, 500)
  }
})

export default cron
