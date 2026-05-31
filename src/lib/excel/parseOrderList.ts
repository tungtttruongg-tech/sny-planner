// src/lib/excel/parseOrderList.ts
// Server-only utility — parses ORDER_LIST .xlsx file using SheetJS.
// Returns an array of ParsedOrder objects ready for DB insert.
//
// Excel file structure (ORDER_LIST_OFFICIAL_20232026.xlsx):
//   Row 0  — title row ("ORDER LIST")    → SKIP
//   Row 1  — header row                  → used to locate columns
//   Row 2+ — data rows
//
// Column mapping (per spec):
//   "PI NUMBER" col  → compound row ID (e.g. "Landmasters20-11") → SKIP
//   PI NUMBER col +1 → actual piNumber  (e.g. "Landmasters20-1")
//   col index 2      → subLineIndex     (1.0, 2.0 …)
//   "CUSTOMER"       → customer
//   "Date"           → orderDate (YYYY-MM-DD)
//   "GSM"            → gsm
//   "WIDTH\n(M)"     → widthM
//   "LENGTH\n(M)"    → lengthM
//   "COLOR"          → color
//   "UV"             → uvPct  (decimal, 0.02 = 2%)
//   "FR"             → frFlag (0 = false, non-zero = true)
//   "QU'TY"          → qty
//   "DESCRIPTION"    → description
//   "REMARK"         → remark

import * as XLSX from 'xlsx'
import type { ParsedOrder } from '@/types'

// ── Value coercion helpers ────────────────────────────────────────────────────

function safeStr(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s === '' ? null : s
}

function safeNum(v: unknown): number | null {
  if (v == null) return null
  if (v instanceof Date) return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

function safeInt(v: unknown): number | null {
  const n = safeNum(v)
  return n == null ? null : Math.round(n)
}

function safeDate(v: unknown): string | null {
  if (v instanceof Date) {
    // cellDates: true → JS Date object
    return v.toISOString().slice(0, 10)
  }
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  }
  return null
}

function safeBool(v: unknown): boolean {
  if (v == null) return false
  if (typeof v === 'boolean') return v
  const n = Number(v)
  return !isNaN(n) && n !== 0
}

// ── Column detector ───────────────────────────────────────────────────────────

function findColIdx(
  headers: unknown[],
  matcher: (h: string) => boolean,
): number {
  return headers.findIndex(
    (h) => h != null && typeof h === 'string' && matcher(h),
  )
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseOrderList(buffer: Buffer): ParsedOrder[] {
  // cellDates: true → Excel date serials become JS Date objects
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) {
    console.warn('[parseOrderList] Workbook has no sheets')
    return []
  }

  const sheet = wb.Sheets[sheetName]

  // Get 2D array: row 0 = title, row 1 = headers, row 2+ = data
  const allRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,   // return arrays, not objects
    defval: null, // empty cells → null
    // raw: true is the default → numbers stay numbers, Date objects stay Date objects
  })

  if (allRows.length < 3) {
    // Need at least: title + header + 1 data row
    console.warn('[parseOrderList] Sheet has fewer than 3 rows — no data to parse')
    return []
  }

  const headers = allRows[1] as unknown[]
  const dataRows = allRows.slice(2)

  // ── Locate columns by header name ─────────────────────────────────────────
  const piIdColIdx = findColIdx(
    headers,
    (h) => h.toUpperCase().includes('PI') && h.toUpperCase().includes('NUMBER'),
  )
  // Actual piNumber is in the column AFTER the compound ID column
  const piNumberColIdx = piIdColIdx >= 0 ? piIdColIdx + 1 : -1

  // subLineIndex is always at index 2 (per spec)
  const subLineColIdx = 2

  const customerColIdx = findColIdx(headers, (h) => h.toUpperCase() === 'CUSTOMER')
  const dateColIdx = findColIdx(headers, (h) => h.toLowerCase() === 'date')
  const gsmColIdx = findColIdx(headers, (h) => h.toUpperCase() === 'GSM')
  const widthColIdx = findColIdx(headers, (h) => h.toUpperCase().includes('WIDTH'))
  const lengthColIdx = findColIdx(headers, (h) => h.toUpperCase().includes('LENGTH'))
  const colorColIdx = findColIdx(headers, (h) => h.toUpperCase() === 'COLOR')
  const uvColIdx = findColIdx(headers, (h) => h.toUpperCase() === 'UV')
  const frColIdx = findColIdx(headers, (h) => h.toUpperCase() === 'FR')
  const qtyColIdx = findColIdx(
    headers,
    (h) =>
      h.toUpperCase().includes("QU'") ||
      h.toUpperCase() === 'QTY' ||
      h.toUpperCase().includes('QUANTITY'),
  )
  const descColIdx = findColIdx(headers, (h) => h.toUpperCase() === 'DESCRIPTION')
  const remarkColIdx = findColIdx(headers, (h) => h.toUpperCase() === 'REMARK')

  // ── Parse data rows ────────────────────────────────────────────────────────
  const results: ParsedOrder[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    if (!Array.isArray(row)) continue

    try {
      const get = (colIdx: number): unknown =>
        colIdx >= 0 ? row[colIdx] : null

      // piNumber from the column AFTER the "PI NUMBER" compound ID column
      const piNumber = piNumberColIdx >= 0 ? safeStr(get(piNumberColIdx)) : null
      if (!piNumber) continue // skip rows with no PI Number

      const customer = safeStr(get(customerColIdx)) ?? ''
      const orderDate = safeDate(get(dateColIdx)) ?? ''
      const gsm = safeInt(get(gsmColIdx)) ?? 0
      const widthM = safeNum(get(widthColIdx)) ?? 0
      const lengthM = safeNum(get(lengthColIdx)) ?? 0
      const color = (safeStr(get(colorColIdx)) ?? '').toUpperCase()

      // Skip rows missing any required field
      if (!customer || !orderDate || gsm <= 0 || widthM <= 0 || lengthM <= 0) {
        console.warn(`[parseOrderList] Row ${i + 2} skipped — missing required field`)
        continue
      }

      results.push({
        piNumber,
        subLineIndex: safeInt(get(subLineColIdx)) ?? 0,
        customer,
        orderDate,
        widthM,
        lengthM,
        gsm,
        color,
        qty: safeInt(get(qtyColIdx)),
        uvPct: safeNum(get(uvColIdx)),
        frFlag: safeBool(get(frColIdx)),
        description: safeStr(get(descColIdx)),
        remark: safeStr(get(remarkColIdx)),
      })
    } catch (err) {
      console.warn(`[parseOrderList] Row ${i + 2} threw during parse — skipping:`, err)
    }
  }

  return results
}
