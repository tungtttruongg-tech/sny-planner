'use client'

// src/components/orders/MultiLineOrderForm.tsx
// Unified order-creation form — shared PI/Customer/MBCode/Notes at top,
// N repeatable per-line rows below.
//
// Per-line fields (after migration):
//   gsm, meshType, needleCount, beamCount — moved from shared → per-line
//   eyeletLines, eyeletSpec — new per-line eyelet spec fields
//
// "+ Thêm dòng" copies ALL per-line fields from the previous row so planners
// only need to adjust the fields that differ (usually just color/width).

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { calculateOrderWeight } from '@/lib/calculations/orderWeight'

// ── Types ─────────────────────────────────────────────────────────────────────

type OrderType = 'meters' | 'rolls' | 'pieces'

interface LineItem {
  id: number          // ephemeral UI key only
  color: string
  widthM: string
  gsm: string         // per-line (was shared)
  orderType: OrderType
  lengthM: string
  qty: string
  rollLength: string
  pieceLength: string
  uvPct: string
  frPct: string
  mbCode: string
  requiresPacking: boolean
  lineNote: string
  hasEyelet: boolean
  eyeletColor: string
  meshType: string    // per-line (was shared)
  needleCount: string // per-line (was shared)
  beamCount: string   // per-line (was shared)
  eyeletLines: string // new
  eyeletSpec: string  // new
}

// ── Styling helpers ───────────────────────────────────────────────────────────

const inputCls = (hasError = false) =>
  [
    'w-full bg-transparent border-[0.5px] rounded px-3 py-2 text-sm',
    'text-on-surface placeholder:text-outline',
    'focus:outline-none focus:border-primary focus:border-b-2 transition-colors',
    hasError ? 'border-error' : 'border-outline-variant',
  ].join(' ')

const monoInputCls = (hasError = false) =>
  [
    'w-full bg-transparent border-[0.5px] rounded px-3 py-2 text-sm',
    'font-mono text-on-surface placeholder:text-outline tabular-nums',
    'focus:outline-none focus:border-primary focus:border-b-2 transition-colors',
    hasError ? 'border-error' : 'border-outline-variant',
  ].join(' ')

const textareaCls =
  'w-full bg-transparent border-[0.5px] border-outline-variant rounded px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:border-b-2 transition-colors resize-none'

// ── Sub-component: Field label ────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-inter font-medium text-secondary mb-1">
      {children}
      {required && <span className="text-error ml-1">*</span>}
    </label>
  )
}

// ── Live calculation per line ─────────────────────────────────────────────────

function calcLine(line: LineItem) {
  const w = parseFloat(line.widthM)
  const g = parseInt(line.gsm)
  if (!w || !g || isNaN(w) || isNaN(g)) return null

  const qty         = line.qty         ? parseInt(line.qty)           : null
  const rollLength  = line.rollLength  ? parseFloat(line.rollLength)  : null
  const pieceLength = line.pieceLength ? parseFloat(line.pieceLength) : null
  const lengthM     = line.lengthM     ? parseFloat(line.lengthM)     : 0

  const result = calculateOrderWeight({
    orderType: line.orderType,
    widthM: w,
    lengthM,
    gsm: g,
    qty,
    rollLength,
    pieceLength,
  })

  if (result.totalMeters <= 0) return null
  return result
}

// ── Empty/default line factory ────────────────────────────────────────────────

let _lineIdCounter = 0
function newLine(): LineItem {
  return {
    id: ++_lineIdCounter,
    color: '',
    widthM: '',
    gsm: '',
    orderType: 'rolls',
    lengthM: '',
    qty: '',
    rollLength: '',
    pieceLength: '',
    uvPct: '',
    frPct: '',
    mbCode: '',
    requiresPacking: false,
    lineNote: '',
    hasEyelet: false,
    eyeletColor: '',
    meshType: '',
    needleCount: '',
    beamCount: '',
    eyeletLines: '',
    eyeletSpec: '',
  }
}

// Copies a line for "+ Thêm dòng" — resets only color (usually changes per line)
function copyLine(prev: LineItem): LineItem {
  return {
    ...prev,
    id: ++_lineIdCounter,
    color: '',          // reset — most common per-line change
    // all other fields copied so planner only adjusts what differs
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MultiLineOrderForm() {
  const router = useRouter()

  // ── Shared fields (apply to all sub-lines) ─────────────────────────────────
  const [piNumber,    setPiNumber]    = useState('')
  const [customer,    setCustomer]    = useState('')
  const [orderDate,   setOrderDate]   = useState('')
  const [deliveryDate,setDeliveryDate]= useState('')
  const [containerSize,setContainerSize]= useState('')
  const [description, setDescription] = useState('')
  const [remark,      setRemark]      = useState('')

  // ── Lines (now include gsm, meshType, needleCount, beamCount per line) ──────
  const [lines, setLines] = useState<LineItem[]>([newLine()])

  // ── UI state ──────────────────────────────────────────────────────────────
  const [isSaving,    setIsSaving]    = useState(false)
  const [apiError,    setApiError]    = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // ── Line mutation helpers ─────────────────────────────────────────────────

  // Copy all fields from last line (only color reset) — prevents re-entering common specs
  const addLine = () => setLines((prev) => [...prev, copyLine(prev[prev.length - 1])])

  const removeLine = (id: number) =>
    setLines((prev) => prev.length > 1 ? prev.filter((l) => l.id !== id) : prev)

  const updateLine = useCallback(
    (id: number, patch: Partial<LineItem>) =>
      setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l))),
    [],
  )

  // ── Client-side validation ────────────────────────────────────────────────

  function validate(): boolean {
    const errs: Record<string, string> = {}

    if (!piNumber.trim()) errs.piNumber  = 'PI Number là bắt buộc'
    if (!customer.trim()) errs.customer  = 'Khách hàng là bắt buộc'
    if (!orderDate)       errs.orderDate = 'Ngày đặt hàng là bắt buộc'

    lines.forEach((line, i) => {
      const p = `lines.${i}`
      const w   = parseFloat(line.widthM)
      const gsm = parseInt(line.gsm)

      if (!line.widthM || isNaN(w) || w <= 0) errs[`${p}.widthM`] = 'Khổ phải lớn hơn 0'
      if (!line.color.trim())                  errs[`${p}.color`]  = 'Màu là bắt buộc'
      if (!line.gsm || isNaN(gsm) || gsm <= 0) errs[`${p}.gsm`]   = 'GSM phải lớn hơn 0'

      if (line.orderType === 'meters') {
        const l = parseFloat(line.lengthM)
        if (!line.lengthM || isNaN(l) || l <= 0) errs[`${p}.lengthM`] = 'Chiều dài phải lớn hơn 0'
      }
      if (line.orderType === 'rolls') {
        const q  = parseInt(line.qty)
        const rl = parseFloat(line.rollLength)
        if (!line.qty        || isNaN(q)  || q  <= 0) errs[`${p}.qty`]        = 'Số cuộn phải lớn hơn 0'
        if (!line.rollLength || isNaN(rl) || rl <= 0) errs[`${p}.rollLength`] = 'Mét/cuộn phải lớn hơn 0'
      }
      if (line.orderType === 'pieces') {
        const q  = parseInt(line.qty)
        const pl = parseFloat(line.pieceLength)
        if (!line.qty        || isNaN(q)  || q  <= 0) errs[`${p}.qty`]         = 'Số tấm phải lớn hơn 0'
        if (!line.pieceLength || isNaN(pl) || pl <= 0) errs[`${p}.pieceLength`] = 'Chiều dài tấm phải lớn hơn 0'
      }
    })

    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)
    if (!validate()) return

    const payload = {
      // Shared fields
      piNumber:    piNumber.trim(),
      customer:    customer.trim(),
      orderDate,
      deliveryDate: deliveryDate || undefined,
      containerSize: containerSize.trim() || undefined,
      description: description.trim() || undefined,
      remark:      remark.trim()      || undefined,
      // Per-line fields (gsm, meshType, needleCount, beamCount now inside each line)
      lines: lines.map((line) => ({
        color:     line.color.trim(),
        widthM:    parseFloat(line.widthM),
        gsm:       parseInt(line.gsm),
        orderType: line.orderType,
        ...(line.orderType === 'meters' && {
          lengthM: parseFloat(line.lengthM),
        }),
        ...(line.orderType === 'rolls' && {
          qty:        parseInt(line.qty),
          rollLength: parseFloat(line.rollLength),
        }),
        ...(line.orderType === 'pieces' && {
          qty:         parseInt(line.qty),
          pieceLength: parseFloat(line.pieceLength),
        }),
        uvPct:      line.uvPct ? parseFloat(line.uvPct) : undefined,
        frPct:      line.frPct ? parseFloat(line.frPct) : undefined,
        mbCode:     line.mbCode.trim() || undefined,
        requiresPacking: line.requiresPacking,
        lineNote:   line.lineNote.trim() || undefined,
        hasEyelet:  line.hasEyelet,
        eyeletColor: line.hasEyelet && line.eyeletColor.trim() ? line.eyeletColor.trim() : undefined,
        meshType:    line.meshType.trim()    || undefined,
        needleCount: line.needleCount        ? parseInt(line.needleCount)   : undefined,
        beamCount:   line.beamCount          ? parseInt(line.beamCount)     : undefined,
        eyeletLines: line.eyeletLines        ? parseInt(line.eyeletLines)   : undefined,
        eyeletSpec:  line.eyeletSpec.trim()  || undefined,
      })),
    }

    setIsSaving(true)
    try {
      const res  = await fetch('/api/orders/multi-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json() as { success: boolean; error?: string }
      if (!res.ok || !json.success) {
        setApiError(json.error ?? 'Đã xảy ra lỗi không xác định.')
        return
      }
      router.push('/orders')
    } catch {
      setApiError('Lỗi mạng — không thể kết nối máy chủ.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">

      {/* Error banner */}
      {apiError && (
        <div role="alert" className="flex items-start gap-2 border border-error/40 bg-error-container rounded-lg px-4 py-3">
          <span className="material-symbols-outlined text-[18px] text-error shrink-0 mt-0.5">error</span>
          <p className="text-sm font-inter text-error">{apiError}</p>
        </div>
      )}

      {/* ── Shared fields card ─────────────────────────────────────────────── */}
      <section className="bg-surface-container-lowest border-[0.5px] border-outline-variant rounded-xl p-6">
        <p className="text-xs font-inter font-semibold text-secondary uppercase tracking-widest mb-4">
          Thông tin chung — áp dụng cho tất cả dòng hàng
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* PI Number */}
          <div>
            <Label required>PI Number</Label>
            <input
              id="ml-piNumber"
              type="text"
              placeholder="e.g. GBN26-110"
              value={piNumber}
              onChange={(e) => setPiNumber(e.target.value)}
              className={monoInputCls(!!fieldErrors.piNumber)}
            />
            {fieldErrors.piNumber && <p className="text-xs text-error mt-1">{fieldErrors.piNumber}</p>}
          </div>

          {/* Customer */}
          <div>
            <Label required>Khách hàng</Label>
            <input
              id="ml-customer"
              type="text"
              placeholder="e.g. GRABINO"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className={inputCls(!!fieldErrors.customer)}
            />
            {fieldErrors.customer && <p className="text-xs text-error mt-1">{fieldErrors.customer}</p>}
          </div>

          {/* Order Date */}
          <div>
            <Label required>Ngày đặt hàng</Label>
            <input
              id="ml-orderDate"
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className={monoInputCls(!!fieldErrors.orderDate)}
            />
            {fieldErrors.orderDate && <p className="text-xs text-error mt-1">{fieldErrors.orderDate}</p>}
          </div>

          {/* Delivery Date */}
          <div>
            <Label>Ngày giao hàng</Label>
            <input
              id="ml-deliveryDate"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className={monoInputCls()}
            />
          </div>

          {/* Container Size */}
          <div>
            <Label>Container size</Label>
            <input
              id="ml-containerSize"
              type="text"
              placeholder="e.g. 40HQ x 1"
              value={containerSize}
              onChange={(e) => setContainerSize(e.target.value)}
              className={inputCls()}
            />
          </div>

          {/* Description */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Label>Mô tả (Description)</Label>
            <textarea
              id="ml-description"
              rows={2}
              placeholder="Ghi chú mô tả đơn hàng..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={textareaCls}
            />
          </div>

          {/* Remark */}
          <div className="sm:col-span-2 lg:col-span-3">
            <Label>Ghi chú nội bộ (Remark)</Label>
            <textarea
              id="ml-remark"
              rows={2}
              placeholder="Ghi chú nội bộ..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className={textareaCls}
            />
          </div>
        </div>
      </section>

      {/* ── Per-line rows ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-inter font-semibold text-secondary uppercase tracking-widest">
            Dòng hàng ({lines.length})
          </p>
          <p className="text-xs text-secondary font-inter">
            Sub-line sẽ được đánh số tự động bắt đầu từ 0
          </p>
        </div>

        {lines.map((line, idx) => {
          const calc = calcLine(line)
          const p    = `lines.${idx}`

          return (
            <div
              key={line.id}
              className="bg-surface-container-lowest border-[0.5px] border-outline-variant rounded-xl p-4"
            >
              {/* Row header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-inter font-semibold text-primary">
                  Dòng #{idx + 1}
                  {lines.length > 1 && (
                    <span className="ml-2 text-outline font-normal">(sub-line {idx})</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  disabled={lines.length === 1}
                  className="inline-flex items-center gap-1 text-xs text-error hover:text-error/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Xoá dòng
                </button>
              </div>

              {/* Required fields grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">

                {/* Color */}
                <div>
                  <Label required>Màu (Color)</Label>
                  <input
                    id={`ml-line-${line.id}-color`}
                    type="text"
                    placeholder="e.g. BLACK"
                    value={line.color}
                    onChange={(e) => updateLine(line.id, { color: e.target.value })}
                    className={inputCls(!!fieldErrors[`${p}.color`])}
                  />
                  {fieldErrors[`${p}.color`] && (
                    <p className="text-xs text-error mt-1">{fieldErrors[`${p}.color`]}</p>
                  )}
                </div>

                {/* Width */}
                <div>
                  <Label required>Khổ (m)</Label>
                  <input
                    id={`ml-line-${line.id}-widthM`}
                    type="number" min={0.1} max={20} step={0.1}
                    placeholder="e.g. 4.0"
                    value={line.widthM}
                    onChange={(e) => updateLine(line.id, { widthM: e.target.value })}
                    className={monoInputCls(!!fieldErrors[`${p}.widthM`])}
                  />
                  {fieldErrors[`${p}.widthM`] && (
                    <p className="text-xs text-error mt-1">{fieldErrors[`${p}.widthM`]}</p>
                  )}
                </div>

                {/* GSM — per-line (moved from shared) */}
                <div>
                  <Label required>GSM</Label>
                  <input
                    id={`ml-line-${line.id}-gsm`}
                    type="number" min={1} max={500} step={1}
                    placeholder="e.g. 95"
                    value={line.gsm}
                    onChange={(e) => updateLine(line.id, { gsm: e.target.value })}
                    className={monoInputCls(!!fieldErrors[`${p}.gsm`])}
                  />
                  {fieldErrors[`${p}.gsm`] && (
                    <p className="text-xs text-error mt-1">{fieldErrors[`${p}.gsm`]}</p>
                  )}
                </div>

                {/* Order Type */}
                <div>
                  <Label required>Kiểu đơn</Label>
                  <select
                    id={`ml-line-${line.id}-orderType`}
                    value={line.orderType}
                    onChange={(e) => updateLine(line.id, { orderType: e.target.value as OrderType })}
                    className={inputCls()}
                  >
                    <option value="rolls">Theo cuộn</option>
                    <option value="meters">Tổng mét</option>
                    <option value="pieces">Gia công tấm</option>
                  </select>
                </div>

                {/* meters → Length */}
                {line.orderType === 'meters' && (
                  <div>
                    <Label required>Chiều dài (m)</Label>
                    <input
                      id={`ml-line-${line.id}-lengthM`}
                      type="number" min={1} max={100000} step={1}
                      placeholder="e.g. 30000"
                      value={line.lengthM}
                      onChange={(e) => updateLine(line.id, { lengthM: e.target.value })}
                      className={monoInputCls(!!fieldErrors[`${p}.lengthM`])}
                    />
                    {fieldErrors[`${p}.lengthM`] && (
                      <p className="text-xs text-error mt-1">{fieldErrors[`${p}.lengthM`]}</p>
                    )}
                  </div>
                )}

                {/* rolls → qty + rollLength */}
                {line.orderType === 'rolls' && (
                  <>
                    <div>
                      <Label required>Số cuộn</Label>
                      <input
                        id={`ml-line-${line.id}-qty`}
                        type="number" min={1} step={1}
                        placeholder="e.g. 200"
                        value={line.qty}
                        onChange={(e) => updateLine(line.id, { qty: e.target.value })}
                        className={monoInputCls(!!fieldErrors[`${p}.qty`])}
                      />
                      {fieldErrors[`${p}.qty`] && (
                        <p className="text-xs text-error mt-1">{fieldErrors[`${p}.qty`]}</p>
                      )}
                    </div>
                    <div>
                      <Label required>Mét/cuộn</Label>
                      <input
                        id={`ml-line-${line.id}-rollLength`}
                        type="number" min={0.1} step={0.01}
                        placeholder="e.g. 50"
                        value={line.rollLength}
                        onChange={(e) => updateLine(line.id, { rollLength: e.target.value })}
                        className={monoInputCls(!!fieldErrors[`${p}.rollLength`])}
                      />
                      {fieldErrors[`${p}.rollLength`] && (
                        <p className="text-xs text-error mt-1">{fieldErrors[`${p}.rollLength`]}</p>
                      )}
                    </div>
                  </>
                )}

                {/* pieces → qty + pieceLength */}
                {line.orderType === 'pieces' && (
                  <>
                    <div>
                      <Label required>Số tấm</Label>
                      <input
                        id={`ml-line-${line.id}-qty-pieces`}
                        type="number" min={1} step={1}
                        placeholder="e.g. 4200"
                        value={line.qty}
                        onChange={(e) => updateLine(line.id, { qty: e.target.value })}
                        className={monoInputCls(!!fieldErrors[`${p}.qty`])}
                      />
                      {fieldErrors[`${p}.qty`] && (
                        <p className="text-xs text-error mt-1">{fieldErrors[`${p}.qty`]}</p>
                      )}
                    </div>
                    <div>
                      <Label required>Chiều dài tấm (m)</Label>
                      <input
                        id={`ml-line-${line.id}-pieceLength`}
                        type="number" min={0.01} step={0.01}
                        placeholder="e.g. 2.44"
                        value={line.pieceLength}
                        onChange={(e) => updateLine(line.id, { pieceLength: e.target.value })}
                        className={monoInputCls(!!fieldErrors[`${p}.pieceLength`])}
                      />
                      {fieldErrors[`${p}.pieceLength`] && (
                        <p className="text-xs text-error mt-1">{fieldErrors[`${p}.pieceLength`]}</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Technical specs + optional fields */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2 border-t-[0.5px] border-outline-variant/50">

                {/* Mesh Type — per-line (moved from shared) */}
                <div>
                  <Label>Loại lưới</Label>
                  <input
                    id={`ml-line-${line.id}-meshType`}
                    type="text"
                    placeholder="e.g. Hex, Diamond..."
                    value={line.meshType}
                    onChange={(e) => updateLine(line.id, { meshType: e.target.value })}
                    className={inputCls()}
                  />
                </div>

                {/* Needle Count — per-line (moved from shared) */}
                <div>
                  <Label>Số kim</Label>
                  <input
                    id={`ml-line-${line.id}-needleCount`}
                    type="number" min={1} step={1}
                    placeholder="e.g. 192"
                    value={line.needleCount}
                    onChange={(e) => updateLine(line.id, { needleCount: e.target.value })}
                    className={monoInputCls()}
                  />
                </div>

                {/* Beam Count — per-line (moved from shared) */}
                <div>
                  <Label>Số dàn</Label>
                  <input
                    id={`ml-line-${line.id}-beamCount`}
                    type="number" min={1} step={1}
                    placeholder="e.g. 2"
                    value={line.beamCount}
                    onChange={(e) => updateLine(line.id, { beamCount: e.target.value })}
                    className={monoInputCls()}
                  />
                </div>

                {/* UV% */}
                <div>
                  <Label>UV %</Label>
                  <input
                    id={`ml-line-${line.id}-uvPct`}
                    type="number" min={0} max={100} step={0.01}
                    placeholder="e.g. 2.5"
                    value={line.uvPct}
                    onChange={(e) => updateLine(line.id, { uvPct: e.target.value })}
                    className={monoInputCls()}
                  />
                </div>

                {/* MB Code — per-line */}
                <div>
                  <Label>Mã màu (MB Code)</Label>
                  <input
                    id={`ml-line-${line.id}-mbCode`}
                    type="text"
                    placeholder="e.g. MYD4501A"
                    value={line.mbCode}
                    onChange={(e) => updateLine(line.id, { mbCode: e.target.value })}
                    className={monoInputCls()}
                  />
                </div>

                {/* FR% — replaces FR checkbox */}
                <div>
                  <Label>FR %</Label>
                  <input
                    id={`ml-line-${line.id}-frPct`}
                    type="number" min={0} max={100} step={0.01}
                    placeholder="e.g. 6.5"
                    value={line.frPct}
                    onChange={(e) => updateLine(line.id, { frPct: e.target.value })}
                    className={monoInputCls()}
                  />
                </div>
                {/* Requires Packing */}
                <div className="flex flex-col justify-end pb-1">
                  <div className="flex items-center gap-2 py-2">
                    <input
                      id={`ml-line-${line.id}-requiresPacking`}
                      type="checkbox"
                      checked={line.requiresPacking}
                      onChange={(e) => updateLine(line.id, { requiresPacking: e.target.checked })}
                      className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor={`ml-line-${line.id}-requiresPacking`} className="text-sm font-noto text-on-surface cursor-pointer select-none">
                      Cần đóng gói
                    </label>
                  </div>
                </div>

                {/* Eyelet checkbox */}
                <div className="flex flex-col justify-end pb-1">
                  <div className="flex items-center gap-2 py-2">
                    <input
                      id={`ml-line-${line.id}-hasEyelet`}
                      type="checkbox"
                      checked={line.hasEyelet}
                      onChange={(e) => updateLine(line.id, { hasEyelet: e.target.checked })}
                      className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor={`ml-line-${line.id}-hasEyelet`} className="text-sm font-noto text-on-surface cursor-pointer select-none">
                      Có eyelet
                    </label>
                  </div>
                </div>

                {/* Eyelet color — only when hasEyelet */}
                {line.hasEyelet && (
                  <div>
                    <Label>Màu eyelet</Label>
                    <input
                      id={`ml-line-${line.id}-eyeletColor`}
                      type="text"
                      placeholder="e.g. SILVER"
                      value={line.eyeletColor}
                      onChange={(e) => updateLine(line.id, { eyeletColor: e.target.value })}
                      className={inputCls()}
                    />
                  </div>
                )}

                {/* Eyelet Lines — new per-line spec field */}
                <div>
                  <Label>Số lines eyelet</Label>
                  <input
                    id={`ml-line-${line.id}-eyeletLines`}
                    type="number" min={1} step={1}
                    placeholder="e.g. 4"
                    value={line.eyeletLines}
                    onChange={(e) => updateLine(line.id, { eyeletLines: e.target.value })}
                    className={monoInputCls()}
                  />
                </div>

                {/* Eyelet Spec — new per-line spec field */}
                <div className="sm:col-span-2">
                  <Label>Mô tả eyelet</Label>
                  <input
                    id={`ml-line-${line.id}-eyeletSpec`}
                    type="text"
                    placeholder="VD: 5cm interval, single band both edges"
                    value={line.eyeletSpec}
                    onChange={(e) => updateLine(line.id, { eyeletSpec: e.target.value })}
                    className={inputCls()}
                  />
                </div>
                {/* Line Note */}
                <div className="sm:col-span-2">
                  <Label>Ghi chú dòng</Label>
                  <input
                    id={`ml-line-${line.id}-lineNote`}
                    type="text"
                    placeholder="VD: Màu cần confirm với khách"
                    value={line.lineNote}
                    onChange={(e) => updateLine(line.id, { lineNote: e.target.value })}
                    className={inputCls()}
                  />
                </div>
              </div>

              {/* Live calculation preview */}
              {calc && (
                <div className="mt-3 flex flex-wrap gap-4 px-1">
                  <span className="text-xs font-inter text-secondary">
                    Tổng mét:{' '}
                    <span className="font-mono text-on-surface font-semibold">
                      {calc.totalMeters.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} m
                    </span>
                  </span>
                  <span className="text-xs font-inter text-secondary">
                    Trọng lượng ước tính:{' '}
                    <span className="font-mono text-on-surface font-semibold">
                      {calc.totalWeightKgs.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} kg
                    </span>
                  </span>
                </div>
              )}
            </div>
          )
        })}

        {/* Add line button */}
        <button
          type="button"
          id="btn-add-line"
          onClick={addLine}
          className="inline-flex items-center gap-2 border border-dashed border-primary text-primary text-sm font-medium px-4 py-2 h-9 rounded-lg hover:bg-primary/5 transition-colors w-full justify-center"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          + Thêm dòng hàng (copy từ dòng trước)
        </button>
      </div>

      {/* ── Submit ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t-[0.5px] border-outline-variant">
        <p className="text-xs font-inter text-secondary">
          {lines.length === 1
            ? 'Sẽ tạo 1 đơn hàng (sub-line 0)'
            : `Sẽ tạo ${lines.length} đơn hàng (sub-line 0–${lines.length - 1})`}
        </p>
        <button
          id="btn-save-multi"
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary text-sm font-medium px-6 py-2 h-9 rounded-md hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {isSaving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Đang lưu…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">save</span>
              {lines.length === 1 ? 'Lưu đơn hàng' : `Lưu tất cả (${lines.length} dòng)`}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
