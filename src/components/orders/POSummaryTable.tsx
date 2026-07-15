'use client'

// src/components/orders/POSummaryTable.tsx
// Client component — groups ProductionOrder records by piNumber.
// Collapsed by default; each group expands to show per-sub-line details.
// Searchable by PI Number or Customer (case-insensitive).

import { useState, useMemo, useCallback } from 'react'
import type { SerializedProductionOrder } from '@/types'
import { OrderStatus, calcOrderStatus } from '@/lib/orderStatus'
import OrderStatusBadge from './OrderStatusBadge'

// ── Types ──────────────────────────────────────────────────────────────────────

interface PIGroup {
  piNumber: string
  customers: string[]     // deduplicated; usually 1
  orderDate: string       // ISO string of the most recent sub-line's orderDate
  subLines: SerializedProductionOrder[]
  totalQtySqm: number | null
  totalWeightKgs: number | null
  status: OrderStatus
}

interface Props {
  orders: SerializedProductionOrder[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function groupOrders(orders: SerializedProductionOrder[]): PIGroup[] {
  const map = new Map<string, SerializedProductionOrder[]>()

  for (const o of orders) {
    const existing = map.get(o.piNumber) ?? []
    map.set(o.piNumber, [...existing, o])
  }

  const groups: PIGroup[] = []
  for (const [piNumber, subLines] of Array.from(map.entries())) {
    // Sort sub-lines by subLineIndex
    subLines.sort((a, b) => a.subLineIndex - b.subLineIndex)

    const customers = Array.from(new Set(subLines.map((s) => s.customer)))
    const orderDate = subLines.reduce(
      (latest, s) => (s.orderDate > latest ? s.orderDate : latest),
      subLines[0].orderDate,
    )

    let totalQtySqm: number | null = null
    let totalWeightKgs: number | null = null

    for (const s of subLines) {
      if (s.qtySqm != null) {
        totalQtySqm = (totalQtySqm ?? 0) + parseFloat(s.qtySqm)
      }
      if (s.totalWeightKgs != null) {
        totalWeightKgs = (totalWeightKgs ?? 0) + parseFloat(s.totalWeightKgs)
      }
    }

    const allAssignments = subLines.flatMap(s => s.assignments || [])
    const status = calcOrderStatus(allAssignments)

    groups.push({ piNumber, customers, orderDate, subLines, totalQtySqm, totalWeightKgs, status })
  }

  // Sort groups by most recent orderDate descending
  groups.sort((a, b) => (a.orderDate < b.orderDate ? 1 : -1))
  return groups
}

function fmt(n: number | null, decimals = 1) {
  if (n == null) return '—'
  return n.toLocaleString('vi-VN', { maximumFractionDigits: decimals })
}

function orderTypeLabel(t: string) {
  if (t === 'rolls')  return 'Cuộn'
  if (t === 'pieces') return 'Tấm'
  return 'Mét'
}

// Tiến độ sản xuất per order (lazy-loaded khi expand)
interface ProgressEntry {
  producedMeters: number
  remainingMeters: number
}
type ProgressMap = Record<string, ProgressEntry> // key = orderId

// ── Sub-line detail table ──────────────────────────────────────────────────────

function SubLineTable({
  subLines,
  progress,
}: {
  subLines: SerializedProductionOrder[]
  progress: ProgressMap
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-inter border-collapse">
        <thead>
          <tr className="bg-surface-container-low border-b border-outline-variant text-secondary uppercase tracking-wider">
            <th className="px-3 py-2 text-left font-medium">#</th>
            <th className="px-3 py-2 text-left font-medium">Màu</th>
            <th className="px-3 py-2 text-left font-medium">Khổ (m)</th>
            <th className="px-3 py-2 text-left font-medium">GSM</th>
            <th className="px-3 py-2 text-left font-medium">Kiểu</th>
            <th className="px-3 py-2 text-right font-medium">Mét</th>
            <th className="px-3 py-2 text-right font-medium">SL</th>
            <th className="px-3 py-2 text-right font-medium">m/cuộn</th>
            <th className="px-3 py-2 text-right font-medium">m/tấm</th>
            <th className="px-3 py-2 text-right font-medium">m² (tổng)</th>
            <th className="px-3 py-2 text-right font-medium">kg (tổng)</th>
            <th className="px-3 py-2 text-left font-medium">MB Code</th>
            <th className="px-3 py-2 text-left font-medium">Lưới</th>
            <th className="px-3 py-2 text-right font-medium">Kim</th>
            <th className="px-3 py-2 text-right font-medium">Dàn</th>
            <th className="px-3 py-2 text-center font-medium">Eyelet</th>
            <th className="px-3 py-2 text-left font-medium">Màu eyelet</th>
            <th className="px-3 py-2 text-left font-medium">Đã SX (m)</th>
            <th className="px-3 py-2 text-right font-medium">Còn lại (m)</th>
            <th className="px-3 py-2 text-left font-medium">Nguồn</th>
          </tr>
        </thead>
        <tbody>
          {subLines.map((s) => (
            <tr
              key={s.id}
              className="border-b border-outline-variant/50 hover:bg-surface-container-lowest transition-colors"
            >
              <td className="px-3 py-2 font-mono text-outline">{s.subLineIndex}</td>
              <td className="px-3 py-2 font-medium text-on-surface">{s.color}</td>
              <td className="px-3 py-2 font-mono text-on-surface">{Number(s.widthM).toFixed(1)}</td>
              <td className="px-3 py-2 font-mono text-on-surface">{s.gsm}</td>
              <td className="px-3 py-2 text-secondary">{orderTypeLabel(s.orderType)}</td>
              <td className="px-3 py-2 font-mono text-right text-on-surface">
                {Number(s.lengthM).toLocaleString('vi-VN')}
              </td>
              <td className="px-3 py-2 font-mono text-right text-on-surface">
                {s.qty != null ? s.qty.toLocaleString('vi-VN') : '—'}
              </td>
              <td className="px-3 py-2 font-mono text-right text-secondary">
                {s.rollLength != null ? parseFloat(s.rollLength).toLocaleString('vi-VN') : '—'}
              </td>
              <td className="px-3 py-2 font-mono text-right text-secondary">
                {s.pieceLength != null ? parseFloat(s.pieceLength).toLocaleString('vi-VN') : '—'}
              </td>
              <td className="px-3 py-2 font-mono text-right text-on-surface">
                {s.qtySqm != null ? fmt(parseFloat(s.qtySqm)) : '—'}
              </td>
              <td className="px-3 py-2 font-mono text-right text-on-surface">
                {s.totalWeightKgs != null ? fmt(parseFloat(s.totalWeightKgs)) : '—'}
              </td>
              <td className="px-3 py-2 font-mono text-secondary">{s.mbCode ?? '—'}</td>
              <td className="px-3 py-2 text-secondary">{s.meshType ?? '—'}</td>
              <td className="px-3 py-2 font-mono text-right text-secondary">
                {s.needleCount != null ? s.needleCount : '—'}
              </td>
              <td className="px-3 py-2 font-mono text-right text-secondary">
                {s.beamCount != null ? s.beamCount : '—'}
              </td>
              <td className="px-3 py-2 text-secondary">
                {(() => {
                  const el = (s as { eyeletLines?: number | null }).eyeletLines
                  const es = (s as { eyeletSpec?: string | null }).eyeletSpec
                  if (el != null) {
                    return <span className="font-mono">{el}L{es ? ` · ${es}` : ''}</span>
                  }
                  return s.hasEyelet ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10">
                      <span className="material-symbols-outlined text-[12px] text-primary">check</span>
                    </span>
                  ) : (
                    <span className="text-outline">—</span>
                  )
                })()}
              </td>
              <td className="px-3 py-2 text-secondary">{s.eyeletColor ?? '—'}</td>
              <td className="px-3 py-2 font-mono text-primary font-semibold">
                {progress[s.id] != null
                  ? `${progress[s.id].producedMeters.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} m`
                  : <span className="text-outline text-[10px]">...</span>}
              </td>
              <td className="px-3 py-2 font-mono text-right">
                {progress[s.id] != null
                  ? (
                    <span className={progress[s.id].remainingMeters === 0 ? 'text-[#15803d] font-semibold' : 'text-on-surface'}>
                      {progress[s.id].remainingMeters === 0
                        ? '✔'
                        : `${progress[s.id].remainingMeters.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} m`}
                    </span>
                  )
                  : <span className="text-outline text-[10px]">...</span>}
              </td>
              <td className="px-3 py-2 text-secondary">
                {s.dataSource === 'import' ? 'Import' : s.dataSource === 'seed' ? 'Demo' : 'Manual'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function POSummaryTable({ orders }: Props) {
  const [search, setSearch]             = useState('')
  const [expandedPIs, setExpandedPIs]   = useState<Set<string>>(new Set())
  // progress: keyed by orderId — lazy-loaded when a PI group is expanded
  const [progress, setProgress]         = useState<ProgressMap>({})

  const groups = useMemo(() => groupOrders(orders), [orders])

  // Fetch progress for all sub-lines in a PI group (lazy — only on expand)
  const fetchProgressForGroup = useCallback(async (subLines: SerializedProductionOrder[]) => {
    // Only fetch for orders not already in state
    const missing = subLines.filter((s) => progress[s.id] === undefined)
    if (missing.length === 0) return

    const results = await Promise.all(
      missing.map(async (s) => {
        try {
          const res = await fetch(`/api/knitting/progress/${s.id}`)
          if (!res.ok) return { id: s.id, data: null }
          const json = await res.json() as { success: boolean; producedMeters?: number; remainingMeters?: number }
          if (!json.success) return { id: s.id, data: null }
          return {
            id: s.id,
            data: {
              producedMeters: json.producedMeters ?? 0,
              remainingMeters: json.remainingMeters ?? 0,
            },
          }
        } catch {
          return { id: s.id, data: null }
        }
      })
    )

    setProgress((prev) => {
      const next = { ...prev }
      for (const r of results) {
        if (r.data) next[r.id] = r.data
      }
      return next
    })
  }, [progress])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return groups
    return groups.filter(
      (g) =>
        g.piNumber.toLowerCase().includes(q) ||
        g.customers.some((c) => c.toLowerCase().includes(q)),
    )
  }, [groups, search])

  function togglePI(piNumber: string, subLines: SerializedProductionOrder[]) {
    setExpandedPIs((prev) => {
      const next = new Set(prev)
      if (next.has(piNumber)) {
        next.delete(piNumber)
      } else {
        next.add(piNumber)
        // Lazy-load progress for this PI's sub-lines
        fetchProgressForGroup(subLines)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none">
          search
        </span>
        <input
          id="po-summary-search"
          type="text"
          placeholder="Tìm PI Number hoặc Khách hàng…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-3 rounded-lg border-[0.5px] border-outline-variant bg-surface focus:border-primary focus:outline-none text-sm font-inter text-on-surface placeholder:text-outline transition-colors"
        />
      </div>

      {/* Count */}
      <p className="text-xs font-inter text-secondary">
        {filtered.length} PI Number{filtered.length !== 1 ? 's' : ''}{search ? ` (lọc từ ${groups.length})` : ''}
      </p>

      {/* Groups */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <span className="material-symbols-outlined text-[32px] text-outline">search_off</span>
          <p className="text-sm font-inter text-secondary">Không tìm thấy kết quả.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((group) => {
            const isOpen = expandedPIs.has(group.piNumber)
            return (
              <div
                key={group.piNumber}
                className="bg-surface-container-lowest border-[0.5px] border-outline-variant rounded-xl overflow-hidden"
              >
                {/* Group header — click to expand/collapse */}
                <button
                  type="button"
                  onClick={() => togglePI(group.piNumber, group.subLines)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors text-left"
                >
                  {/* Chevron */}
                  <span
                    className={`material-symbols-outlined text-[18px] text-outline transition-transform duration-200 ${
                      isOpen ? 'rotate-90' : ''
                    }`}
                  >
                    chevron_right
                  </span>

                  {/* PI Number + optional multi-customer warning */}
                  <span className="flex items-center gap-2 min-w-[120px]">
                    <span className="font-mono font-semibold text-sm text-primary">
                      {group.piNumber}
                    </span>
                    <OrderStatusBadge status={group.status} />
                    {group.customers.length > 1 && (
                      <span
                        title="PI Number này có nhiều customer khác nhau — kiểm tra lại dữ liệu"
                        className="text-[#F59E0B] leading-none cursor-help"
                        aria-label="Cảnh báo: nhiều customer"
                      >
                        ⚠
                      </span>
                    )}
                  </span>

                  {/* Customer — first sub-line's customer only */}
                  <span className="text-sm font-inter text-on-surface flex-1 truncate">
                    {group.customers[0]}
                  </span>

                  {/* Sub-line count badge */}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-inter font-medium bg-surface-container text-secondary shrink-0">
                    {group.subLines.length} dòng
                  </span>

                  {/* Totals */}
                  {group.totalQtySqm != null && (
                    <span className="text-xs font-mono text-secondary shrink-0 hidden sm:inline">
                      {fmt(group.totalQtySqm)} m²
                    </span>
                  )}
                  {group.totalWeightKgs != null && (
                    <span className="text-xs font-mono font-semibold text-on-surface shrink-0 hidden sm:inline">
                      {fmt(group.totalWeightKgs)} kg
                    </span>
                  )}

                  {/* Order date of most recent sub-line */}
                  <span className="text-xs font-inter text-outline shrink-0 hidden md:inline">
                    {new Date(group.orderDate).toLocaleDateString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                    })}
                  </span>
                </button>

                {/* Expanded sub-lines */}
                {isOpen && (
                  <div className="border-t-[0.5px] border-outline-variant">
                    <SubLineTable subLines={group.subLines} progress={progress} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
