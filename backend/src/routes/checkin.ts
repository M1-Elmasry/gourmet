import { Hono } from 'hono'
import { uploadImage } from '../lib/cloudinary'
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
        const buffer = Buffer.from(await imageFile.arrayBuffer())
        imageUrl = await uploadImage(buffer, `${user.id}_${Date.now()}`)
      } catch (uploadErr) {
        console.warn('Image upload skipped:', (uploadErr as Error).message)
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
