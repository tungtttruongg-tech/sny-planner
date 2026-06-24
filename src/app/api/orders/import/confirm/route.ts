// src/app/api/orders/import/confirm/route.ts
// POST /api/orders/import/confirm
// Accepts { rows: ParsedOrder[] } JSON body.
// Validates each row, then uses createMany + skipDuplicates to upsert.
// Returns { imported, skipped, errors }.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

// ── Server-side validation schema for imported rows ───────────────────────────
// Less strict than createOrderSchema — data has already been parsed and cleaned.
// Focus: ensure types are correct before DB write.

const importedRowSchema = z.object({
  piNumber:     z.string().min(1).max(50).transform((v) => v.trim()),
  subLineIndex: z.number().int().min(0),
  customer:     z.string().min(1).max(100).transform((v) => v.trim()),
  orderDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  widthM:       z.number().gt(0),
  lengthM:      z.number().gt(0),
  gsm:          z.number().int().gt(0),
  color:        z.string().min(1).max(50).transform((v) => v.trim().toUpperCase()),
  qty:          z.number().int().gt(0).nullable(),
  uvPct:        z.number().min(0).max(100).nullable(),
  frFlag:       z.boolean(),
  description:  z.string().max(200).nullable().transform((v) => v?.trim() ?? null),
  remark:       z.string().max(200).nullable().transform((v) => v?.trim() ?? null),
})

const confirmBodySchema = z.object({
  rows: z.array(importedRowSchema).min(1).max(500),
})

export async function POST(req: NextRequest) {
  // ── 1. Parse body ─────────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON in request body.' },
      { status: 400 },
    )
  }

  // ── 2. Validate ───────────────────────────────────────────────────────────
  const parsed = confirmBodySchema.safeParse(body)
  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((e) => `${String(e.path.join('.'))}: ${e.message}`)
      .join('; ')
    return NextResponse.json(
      { success: false, error: `Validation failed — ${messages}` },
      { status: 422 },
    )
  }

  const { rows } = parsed.data

  // ── 3. Build DB create-data array ─────────────────────────────────────────
  const createData = rows.map((row) => ({
    piNumber:     row.piNumber,
    subLineIndex: row.subLineIndex,
    customer:     row.customer,
    orderDate:    new Date(row.orderDate),
    widthM:       row.widthM,
    lengthM:      row.lengthM,
    gsm:          row.gsm,
    color:        row.color,
    ...(row.qty     != null && { qty: row.qty }),
    ...(row.uvPct   != null && { uvPct: row.uvPct }),
    frFlag:       row.frFlag,
    ...(row.description != null && { description: row.description }),
    ...(row.remark      != null && { remark: row.remark }),
    dataSource: 'import',
  }))

  // ── 4. createMany with skipDuplicates ────────────────────────────────────
  // PostgreSQL translates this to INSERT ... ON CONFLICT DO NOTHING.
  // Duplicates (same piNumber + subLineIndex) are silently skipped — not updated.
  try {
    const result = await prisma.productionOrder.createMany({
      data: createData,
      skipDuplicates: true,
    })

    const imported = result.count
    const skipped = rows.length - imported

    return NextResponse.json({ success: true, imported, skipped, errors: [] })
  } catch (err) {
    console.error('[POST /api/orders/import/confirm] DB error:', err)
    return NextResponse.json(
      { success: false, error: 'A database error occurred while saving the orders. Please try again.' },
      { status: 500 },
    )
  }
}
