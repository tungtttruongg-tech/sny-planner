// scripts/debug-m004-excel.ts
import * as fs from 'fs'
import * as XLSX from 'xlsx'

function debugM4() {
  const buf = fs.readFileSync('C:\\Users\\ACER\\Downloads\\20-21.7.xlsx')
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: false, raw: true })
  const ws = wb.Sheets['KNITTING']
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true }) as unknown[][]

  console.log('=== DEBUG ALL ROWS OF MACHINE 4 IN EXCEL ===')
  for (let i = 40; i <= 56; i++) {
    const r = rows[i] ?? []
    console.log(`Row ${i}:`, r.map((c, idx) => `[c${idx}]: "${c}"`).join(' | '))
  }
}

debugM4()
