// src/app/api/orders/multi-line/route.ts
// POST /api/orders/multi-line
// Creates multiple sub-lines under the same PI Number in a single Prisma transaction.
// Sub-line indices are auto-assigned, continuing from the highest existing index for that PI.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { multiLineOrderSchema } from '@/lib/validations/order'
import { calculateOrderWeight } from '@/lib/calculations/orderWeight'

export async function POST(req: NextRequest) {
  // ── 1. Parse body ──────────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON in request body.' },
      { status: 400 },
    )
  }

  // ── 2. Zod validation ──────────────────────────────────────────────────────
  const parsed = multiLineOrderSchema.safeParse(body)
  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((e) => `${String(e.path.join('.'))}: ${e.message}`)
      .join('; ')
    return NextResponse.json(
      { success: false, error: `Validation failed — ${messages}` },
      { status: 422 },
    )
  }

  const data = parsed.data

  // ── 3. Derive effective lengthM for each line ──────────────────────────────
  // For "rolls" and "pieces", lengthM = calculated totalMeters so the field is
  // populated for display and downstream formulas.
  function effectiveLengthM(line: typeof data.lines[number]): number {
    if (line.orderType === 'rolls' && line.qty && line.rollLength) {
      return line.qty * line.rollLength
    }
    if (line.orderType === 'pieces' && line.qty && line.pieceLength) {
      return line.qty * line.pieceLength
    }
    return line.lengthM ?? 0
  }

  // ── 4. Check existing sub-lines for this PI to avoid index collision ────────
  try {
    const existing = await prisma.productionOrder.findMany({
      where: { piNumber: data.piNumber },
      select: { subLineIndex: true },
      orderBy: { subLineIndex: 'asc' },
    })

    // Continue numbering from the next available index
    const nextIndex = existing.length > 0
      ? Math.max(...existing.map((e) => e.subLineIndex)) + 1
      : 0

    // ── 5. Build create-many payload ──────────────────────────────────────────
    const createPayload = data.lines.map((line, i) => {
      const lm = effectiveLengthM(line)
      const { qtySqm, totalWeightKgs } = calculateOrderWeight({
        orderType: line.orderType,
        widthM: line.widthM,
        lengthM: lm,
        gsm: data.gsm,
        qty: line.qty ?? null,
        rollLength: line.rollLength ?? null,
        pieceLength: line.pieceLength ?? null,
      })

      return {
        piNumber:    data.piNumber,
        subLineIndex: nextIndex + i,
        customer:    data.customer,
        orderDate:   new Date(data.orderDate),
        gsm:         data.gsm,
        color:       line.color,
        widthM:      line.widthM,
        lengthM:     lm,
        orderType:   line.orderType,
        // Conditional per-type fields
        ...(line.qty        != null && { qty:        line.qty }),
        ...(line.rollLength  != null && { rollLength:  line.rollLength }),
        ...(line.pieceLength != null && { pieceLength: line.pieceLength }),
        // Shared optional fields
        ...(data.mbCode      && { mbCode:      data.mbCode }),
        ...(data.meshType    && { meshType:    data.meshType }),
        ...(data.needleCount != null && { needleCount: data.needleCount }),
        ...(data.beamCount   != null && { beamCount:   data.beamCount }),
        ...(data.description && { description: data.description }),
        ...(data.remark      && { remark:      data.remark }),
        // Per-line optional fields
        ...(line.uvPct  != null && { uvPct:  line.uvPct }),
        frFlag:    line.frFlag ?? false,
        hasEyelet: line.hasEyelet ?? false,
        ...(line.eyeletColor && { eyeletColor: line.eyeletColor }),
        // Calculated weight
        qtySqm,
        totalWeightKgs,
        // dataSource: tracks provenance for AI training data quality
        dataSource: 'manual',
      }
    })

    // ── 6. Prisma transaction — all-or-nothing ─────────────────────────────────
    const created = await prisma.$transaction(
      createPayload.map((row) => prisma.productionOrder.create({ data: row }))
    )

    return NextResponse.json({ success: true, orders: created, count: created.length }, { status: 201 })
  } catch (err: unknown) {
    // P2002 = unique constraint violation — duplicate (piNumber, subLineIndex)
    if (
      err !== null &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { success: false, error: 'Duplicate sub-line index detected. Please retry.' },
        { status: 409 },
      )
    }
    console.error('[POST /api/orders/multi-line] Error:', err)
    return NextResponse.json(
      { success: false, error: 'An unexpected server error occurred.' },
      { status: 500 },
    )
  }
}
