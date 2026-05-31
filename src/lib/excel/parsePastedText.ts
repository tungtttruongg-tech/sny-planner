// src/lib/excel/parsePastedText.ts
// Utility for parsing tab-separated text pasted from Excel ORDER_LIST.
//
// Actual column layout when copying from ORDER_LIST_OFFICIAL_20232026.xlsx:
//   Col 0:  PI Number (e.g. "Landskroon26-1")
//   Col 1:  Sub-line index (e.g. 1, 2, 3)
//   Col 2:  Customer (e.g. "Landskroon")
//   Col 3:  Date (e.g. "5/2/2026" = M/D/YYYY)
//   Col 4:  Item/Description (e.g. "Scaffolding net")
//   Col 5:  Description 2 (often same as col 4, skip or append)
//   Col 6:  UV % (e.g. "4%" or empty)
//   Col 7:  FR % or flag (e.g. "6.0%" or empty)
//   Col 8:  GSM (e.g. "50 gsm" or "50")
//   Col 9:  Width (e.g. "2.57 m" or "2.57")
//   Col 10: Length (e.g. "100.00 m" or "100")
//   Col 11: Color (e.g. "Green")
//   Col 12: Unit (e.g. "roll") → SKIP
//   Col 13: Qty (e.g. "75.00")
//   Col 14+: other fields → SKIP

import type { ParsedOrder } from '@/types'

/**
 * Parse a number string that may contain units like "50 gsm", "2.57 m", "100.00 m"
 * Returns the numeric value only.
 */
function parseNumericWithUnit(raw: string): number | null {
  if (!raw) return null
  // Remove common units and commas
  const cleaned = raw.replace(/[,\s]*(gsm|m|roll|kg|%)/gi, '').replace(/,/g, '').trim()
  const val = parseFloat(cleaned)
  return isNaN(val) ? null : val
}

/**
 * Date parser — tries M/D/YYYY (Excel US format) first, then DD/MM/YYYY, then YYYY-MM-DD.
 */
export function parseOrderDate(rawDate: string): string | null {
  const cleaned = rawDate.trim()
  if (!cleaned) return null

  // 1. YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    const d = new Date(cleaned)
    if (!isNaN(d.getTime())) return cleaned
  }

  // 2. M/D/YYYY or MM/DD/YYYY or DD/MM/YYYY
  const match = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (match) {
    const p1 = parseInt(match[1], 10)
    const p2 = parseInt(match[2], 10)
    const year = parseInt(match[3], 10)

    // Try MM/DD/YYYY first (Excel US format — 5/2/2026 = May 2nd)
    const monthA = p1 - 1
    const dayA = p2
    if (monthA >= 0 && monthA < 12 && dayA >= 1 && dayA <= 31) {
      const d = new Date(year, monthA, dayA)
      if (!isNaN(d.getTime()) && d.getDate() === dayA && d.getMonth() === monthA && d.getFullYear() === year) {
        const mm = String(p1).padStart(2, '0')
        const dd = String(p2).padStart(2, '0')
        return `${year}-${mm}-${dd}`
      }
    }

    // Fallback: DD/MM/YYYY
    const dayB = p1
    const monthB = p2 - 1
    if (monthB >= 0 && monthB < 12 && dayB >= 1 && dayB <= 31) {
      const d = new Date(year, monthB, dayB)
      if (!isNaN(d.getTime()) && d.getDate() === dayB && d.getMonth() === monthB && d.getFullYear() === year) {
        const mm = String(p2).padStart(2, '0')
        const dd = String(p1).padStart(2, '0')
        return `${year}-${mm}-${dd}`
      }
    }
  }

  // 3. Fallback to JS default parsing
  const d = new Date(cleaned)
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  return null
}

/**
 * Parse UV or FR percentage value.
 * Accepts "4%", "6.0%", "0.04", "4" etc.
 * Returns decimal value (0.04 for 4%).
 */
function parsePct(raw: string): number | null {
  if (!raw || raw.trim() === '') return null
  const cleaned = raw.trim()
  if (cleaned.endsWith('%')) {
    const val = parseFloat(cleaned.replace('%', ''))
    return isNaN(val) ? null : val / 100
  }
  const val = parseFloat(cleaned)
  if (isNaN(val)) return null
  return val > 1 ? val / 100 : val
}

export function parsePastedText(text: string): ParsedOrder[] {
  return parsePastedTextExtended(text)
    .filter((r) => r.isValid && r.order)
    .map((r) => r.order!)
}

export interface ParsedRowResult {
  order: ParsedOrder | null
  rawLine: string
  error: string | null
  isValid: boolean
}

export function parsePastedTextExtended(text: string): ParsedRowResult[] {
  if (!text) return []
  const lines = text.split(/\r?\n/)
  const results: ParsedRowResult[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const cols = trimmed.split('\t')

    // Col 0: PI Number — required
    const piNumber = cols[0]?.trim()
    if (!piNumber) {
      results.push({ order: null, rawLine: trimmed, error: 'Missing PI Number (column 1)', isValid: false })
      continue
    }

    // Col 1: Sub-line index — required, default 1
    const rawSubLine = cols[1]?.trim()
    const subLineIndex = rawSubLine ? (isNaN(parseInt(rawSubLine, 10)) ? 1 : parseInt(rawSubLine, 10)) : 1

    // Col 2: Customer — required
    const customer = cols[2]?.trim()
    if (!customer) {
      results.push({ order: null, rawLine: trimmed, error: 'Missing Customer (column 3)', isValid: false })
      continue
    }

    // Col 3: Date — required
    const rawDate = cols[3]?.trim()
    if (!rawDate) {
      results.push({ order: null, rawLine: trimmed, error: 'Missing Date (column 4)', isValid: false })
      continue
    }
    const orderDate = parseOrderDate(rawDate)
    if (!orderDate) {
      results.push({ order: null, rawLine: trimmed, error: `Invalid Date: "${rawDate}" (Expected M/D/YYYY or DD/MM/YYYY)`, isValid: false })
      continue
    }

    // Col 4: Item/Description — optional
    const description = cols[4]?.trim() || null

    // Col 5: Description 2 — skip (often duplicate of col 4)

    // Col 6: UV % — optional
    const uvPct = parsePct(cols[6]?.trim() || '')

    // Col 7: FR % — optional, treat as frFlag if non-zero
    const frRaw = cols[7]?.trim() || ''
    const frVal = parsePct(frRaw)
    const frFlag = frVal != null && frVal > 0

    // Col 8: GSM — required (may have "gsm" unit)
    const rawGsm = cols[8]?.trim()
    if (!rawGsm) {
      results.push({ order: null, rawLine: trimmed, error: 'Missing GSM (column 9)', isValid: false })
      continue
    }
    const gsm = Math.round(parseNumericWithUnit(rawGsm) ?? 0)
    if (gsm <= 0) {
      results.push({ order: null, rawLine: trimmed, error: `Invalid GSM: "${rawGsm}"`, isValid: false })
      continue
    }

    // Col 9: Width (m) — required (may have "m" unit)
    const rawWidth = cols[9]?.trim()
    if (!rawWidth) {
      results.push({ order: null, rawLine: trimmed, error: 'Missing Width (column 10)', isValid: false })
      continue
    }
    const widthM = parseNumericWithUnit(rawWidth)
    if (!widthM || widthM <= 0) {
      results.push({ order: null, rawLine: trimmed, error: `Invalid Width: "${rawWidth}"`, isValid: false })
      continue
    }

    // Col 10: Length (m) — required (may have "m" unit)
    const rawLength = cols[10]?.trim()
    if (!rawLength) {
      results.push({ order: null, rawLine: trimmed, error: 'Missing Length (column 11)', isValid: false })
      continue
    }
    const lengthM = parseNumericWithUnit(rawLength)
    if (!lengthM || lengthM <= 0) {
      results.push({ order: null, rawLine: trimmed, error: `Invalid Length: "${rawLength}"`, isValid: false })
      continue
    }

    // Col 11: Color — required
    const rawColor = cols[11]?.trim()
    if (!rawColor) {
      results.push({ order: null, rawLine: trimmed, error: 'Missing Color (column 12)', isValid: false })
      continue
    }
    const color = rawColor.toUpperCase()

    // Col 12: Unit — SKIP

    // Col 13: Qty — optional
    let qty: number | null = null
    const rawQty = cols[13]?.trim()
    if (rawQty) {
      const parsedQty = Math.round(parseNumericWithUnit(rawQty) ?? 0)
      if (parsedQty > 0) qty = parsedQty
    }

    results.push({
      order: {
        piNumber,
        subLineIndex,
        customer,
        orderDate,
        widthM,
        lengthM,
        gsm,
        color,
        qty,
        uvPct,
        frFlag,
        description,
        remark: null,
      },
      rawLine: trimmed,
      error: null,
      isValid: true,
    })
  }

  return results
}