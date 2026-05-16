import { Hono } from 'hono'
import ExcelJS from 'exceljs'
import { sql } from '../db/client'
import { requireAdmin } from '../middleware/auth'

const admin = new Hono()

// Get records from last 48 hours
admin.get('/records', requireAdmin, async (c) => {
  try {
    const records = await sql`
      SELECT 
        r.id,
        r.name,
        r.type,
        r.image_url,
        r.timestamp
      FROM records r
      WHERE r.timestamp >= NOW() - INTERVAL '48 hours'
      ORDER BY r.timestamp DESC
    `
    return c.json({ records })
  } catch (err) {
    console.error('Records error:', err)
    return c.json({ error: 'Failed to fetch records' }, 500)
  }
})

// Download Excel sheet
admin.get('/download', requireAdmin, async (c) => {
  try {
    const records = await sql`
      SELECT 
        r.name,
        r.type,
        r.timestamp,
        r.image_url
      FROM records r
      WHERE r.timestamp >= NOW() - INTERVAL '48 hours'
      ORDER BY r.timestamp DESC
    `

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'CheckIn App'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Records', {
      pageSetup: { fitToPage: true }
    })

    // Header styling
    sheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Action', key: 'type', width: 15 },
      { header: 'Date', key: 'date', width: 18 },
      { header: 'Time', key: 'time', width: 15 },
      { header: 'Image URL', key: 'image_url', width: 50 },
    ]

    // Style header row
    const headerRow = sheet.getRow(1)
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A1A2E' },
      }
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 12 }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    headerRow.height = 30

    // Data rows
    records.forEach((r: any, i: number) => {
      const ts = new Date(r.timestamp)
      const row = sheet.addRow({
        name: r.name,
        type: r.type === 'checkin' ? '✅ Check In' : '🚪 Check Out',
        date: ts.toLocaleDateString('en-GB'),
        time: ts.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        image_url: r.image_url || 'No image',
      })

      // Alternate row colors
      if (i % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F5F5' },
          }
        })
      }
      row.height = 22
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const today = new Date().toISOString().split('T')[0]

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="checkin-records-${today}.xlsx"`,
      },
    })
  } catch (err) {
    console.error('Download error:', err)
    return c.json({ error: 'Failed to generate sheet' }, 500)
  }
})

export default admin
