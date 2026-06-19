// src/app/api/materials/import-transactions/route.ts
// POST /api/materials/import-transactions
// Accepts .xlsx upload, parses with parseMaterialReport, matches materials, returns preview.
// Does NOT write to DB — preview only.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { parseMaterialReport, type ParsedMaterialRow } from '@/lib/excel/parseMaterialReport'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export interface PreviewRow extends ParsedMaterialRow {
  matchedMaterialId: string | null
  matchedMaterialName: string | null
  isNew: boolean
}

export async function POST(req: NextRequest) {
  // ── 1. Parse multipart ─────────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Không đọc được form data.' },
      { status: 400 },
    )
  }

  const file = formData.get('file')
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { success: false, error: 'Chưa tải file lên. Gửi file trong field "file".' },
      { status: 400 },
    )
  }

  const fileName = file instanceof File ? file.name : 'upload'
  if (!fileName.toLowerCase().endsWith('.xlsx')) {
    return NextResponse.json(
      { success: false, error: 'Chỉ chấp nhận file .xlsx.' },
      { status: 422 },
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { success: false, error: 'File phải nhỏ hơn 10 MB.' },
      { status: 422 },
    )
  }

  // ── 2. Parse Excel ─────────────────────────────────────────────────────────
  let parsed: ParsedMaterialRow[]
  try {
    const buf = Buffer.from(await file.arrayBuffer())
    parsed = parseMaterialReport(buf)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi đọc file Excel.'
    return NextResponse.json({ success: false, error: msg }, { status: 422 })
  }

  if (parsed.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Không tìm thấy dòng dữ liệu nào trong file.' },
      { status: 422 },
    )
  }

  // ── 3. Match against existing materials ────────────────────────────────────
  const allMaterials = await prisma.material.findMany({ select: { id: true, name: true } })

  const previewRows: PreviewRow[] = parsed.map((row) => {
    const upper = row.materialName.toUpperCase().trim()
    const match = allMaterials.find(
      (m) => m.name.toUpperCase().trim() === upper,
    )
    return {
      ...row,
      matchedMaterialId: match?.id ?? null,
      matchedMaterialName: match?.name ?? null,
      isNew: !match,
    }
  })

  const matched   = previewRows.filter((r) => !r.isNew).length
  const unmatched = previewRows.filter((r) => r.isNew).length

  return NextResponse.json({
    success: true,
    rows: previewRows,
    parsed: previewRows.length,
    matched,
    unmatched,
  })
}
