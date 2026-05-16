import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { sql } from '../db/client'
import { signToken } from '../middleware/auth'

const auth = new Hono()

// Employee registration
auth.post('/register', async (c) => {
  try {
    const { name, password } = await c.req.json()

    if (!name || !password) {
      return c.json({ error: 'Name and password are required' }, 400)
    }

    if (name.toLowerCase() === 'admin') {
      return c.json({ error: 'This name is reserved' }, 400)
    }

    if (password.length < 4) {
      return c.json({ error: 'Password must be at least 4 characters' }, 400)
    }

    const existing = await sql`SELECT id FROM users WHERE LOWER(name) = LOWER(${name})`
    if (existing.length > 0) {
      return c.json({ error: 'Name already taken' }, 409)
    }

    const hash = await bcrypt.hash(password, 10)
    const result = await sql`
      INSERT INTO users (name, password_hash)
      VALUES (${name.trim()}, ${hash})
      RETURNING id, name
    `

    return c.json({ success: true, user: result[0] })
  } catch (err) {
    console.error('Register error:', err)
    return c.json({ error: 'Registration failed' }, 500)
  }
})

// Employee login
auth.post('/login', async (c) => {
  try {
    const { name, password } = await c.req.json()

    if (!name || !password) {
      return c.json({ error: 'Name and password are required' }, 400)
    }

    const users = await sql`SELECT * FROM users WHERE LOWER(name) = LOWER(${name})`
    if (users.length === 0) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const user = users[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const token = signToken({ id: user.id, name: user.name, role: 'employee' })
    return c.json({ token, name: user.name })
  } catch (err) {
    console.error('Login error:', err)
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Admin login
auth.post('/admin/login', async (c) => {
  try {
    const { username, password } = await c.req.json()

    const adminUser = process.env.ADMIN_USERNAME || 'admin'
    const adminPass = process.env.ADMIN_PASSWORD

    if (!adminPass) {
      return c.json({ error: 'Admin not configured' }, 500)
    }

    if (username !== adminUser || password !== adminPass) {
      return c.json({ error: 'Invalid admin credentials' }, 401)
    }

    const token = signToken({ role: 'admin', name: 'Admin' })
    return c.json({ token })
  } catch (err) {
    console.error('Admin login error:', err)
    return c.json({ error: 'Login failed' }, 500)
  }
})

export default auth
