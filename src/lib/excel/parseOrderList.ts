// src/lib/excel/parseOrderList.ts
// Server-only utility — parses ORDER_LIST .xlsx file using SheetJS.
// Returns an array of ParsedOrder objects ready for DB insert.
//
// Excel file structure (ORDER_LIST_OFFICIAL_20232026.xlsx):
//   Row 0  — title row ("ORDER LIST")    → SKIP
//   Row 1  — header row                  → SKIP (columns located by fixed index)
//   Row 2+ — data rows
//
// Column mapping (confirmed from actual file):
//   Col 0: compound row ID (e.g. "Landmasters20-11") → SKIP
//   Col 1: piNumber (e.g. "Landmasters20-1")
//   Col 2: subLineIndex (1.0, 2.0...)
//   Col 3: customer
//   Col 4: orderDate
//   Col 5: item (SKIP)
//   Col 6: description
//   Col 7: uvPct (0.02 = 2%)
//   Col 8: frFlag (0 = false, non-zero = true)
//   Col 9: gsm
//   Col 10: widthM
//   Col 11: lengthM
//   Col 12: color
//   Col 13: unit (SKIP)
//   Col 14: qty
//   Col 28: remark

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

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseOrderList(buffer: Buffer): ParsedOrder[] {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) {
    console.warn('[parseOrderList] Workbook has no sheets')
    return []
  }

  const sheet = wb.Sheets[sheetName]

  // Get 2D array: row 0 = title, row 1 = headers, row 2+ = data
  const allRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
  })

  if (allRows.length < 3) {
    console.warn('[parseOrderList] Sheet has fewer than 3 rows — no data to parse')
    return []
  }

  // Skip row 0 (title) and row 1 (header) — data starts from row 2
  const dataRows = allRows.slice(2)

  // ── Fixed column indices (confirmed from actual file) ─────────────────────
  const COL_PI_NUMBER    = 1   // e.g. "Landmasters20-1"
  const COL_SUB_LINE     = 2   // e.g. 1.0, 2.0
  const COL_CUSTOMER     = 3
  const COL_DATE         = 4
  const COL_DESCRIPTION  = 6
  const COL_UV_PCT       = 7   // 0.02 = 2%
  const COL_FR_FLAG      = 8   // 0 = false, non-zero = true
  const COL_GSM          = 9
  const COL_WIDTH        = 10  // WIDTH (M)
  const COL_LENGTH       = 11  // LENGTH (M)
  const COL_COLOR        = 12
  const COL_QTY          = 14  // QU'TY (rolls)
  const COL_REMARK       = 28

  // ── Parse data rows ────────────────────────────────────────────────────────
  const results: ParsedOrder[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    if (!Array.isArray(row)) continue

    try {
      const get = (colIdx: number): unknown => row[colIdx] ?? null

      const piNumber = safeStr(get(COL_PI_NUMBER))
      if (!piNumber) continue // skip rows with no PI Number

      const customer  = safeStr(get(COL_CUSTOMER)) ?? ''
      const orderDate = safeDate(get(COL_DATE)) ?? ''
      const gsm       = safeInt(get(COL_GSM)) ?? 0
      const widthM    = safeNum(get(COL_WIDTH)) ?? 0
      const lengthM   = safeNum(get(COL_LENGTH)) ?? 0
      const color     = (safeStr(get(COL_COLOR)) ?? '').toUpperCase()

      // Skip rows missing any required field
      if (!customer || !orderDate || gsm <= 0 || widthM <= 0 || lengthM <= 0) {
        console.warn(`[parseOrderList] Row ${i + 2} skipped — missing required field`)
        continue
      }

      results.push({
        piNumber,
        subLineIndex: safeInt(get(COL_SUB_LINE)) ?? 1,
        customer,
        orderDate,
        widthM,
        lengthM,
        gsm,
        color,
        qty:         safeInt(get(COL_QTY)),
        uvPct:       safeNum(get(COL_UV_PCT)),
        frFlag:      safeBool(get(COL_FR_FLAG)),
        description: safeStr(get(COL_DESCRIPTION)),
        remark:      safeStr(get(COL_REMARK)),
      })
    } catch (err) {
      console.warn(`[parseOrderList] Row ${i + 2} threw during parse — skipping:`, err)
    }
  }

  return results
}