import { Hono } from 'hono'
import { put } from '@vercel/blob'
import { sql } from '../db/client'
import { requireAuth } from '../middleware/auth'

const checkin = new Hono()

async function handleCheckInOut(c: any, type: 'checkin' | 'checkout') {
  try {
    const user = c.get('user')
    const formData = await c.req.formData()
    const imageFile = formData.get('image') as File | null

    let imageUrl: string | null = null

    if (imageFile && imageFile.size > 0) {
      try {
        const buffer = await imageFile.arrayBuffer()
        const blob = await put(`checkin/${user.id}/${Date.now()}.jpg`, buffer, {
          access: 'public',
          contentType: 'image/jpeg',
        })
        imageUrl = blob.url
      } catch (blobErr) {
        console.warn('Blob upload skipped:', (blobErr as Error).message)
      }
    }

    const result = await sql`
      INSERT INTO records (user_id, name, type, image_url)
      VALUES (${user.id}, ${user.name}, ${type}, ${imageUrl})
      RETURNING id, name, type, image_url, timestamp
    `

    return c.json({ success: true, record: result[0] })
  } catch (err) {
    console.error(`${type} error:`, err)
    return c.json({ error: `Failed to record ${type}` }, 500)
  }
}

checkin.post('/checkin', requireAuth, (c) => handleCheckInOut(c, 'checkin'))
checkin.post('/checkout', requireAuth, (c) => handleCheckInOut(c, 'checkout'))

export default checkin
