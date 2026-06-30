'use client'

// src/components/orders/POSummaryTable.tsx
// Client component — groups ProductionOrder records by piNumber.
// Collapsed by default; each group expands to show per-sub-line details.
// Searchable by PI Number or Customer (case-insensitive).

import { useState, useMemo } from 'react'
import type { SerializedProductionOrder } from '@/types'

// ── Types ──────────────────────────────────────────────────────────────────────

interface PIGroup {
  piNumber: string
  customers: string[]     // deduplicated; usually 1
  orderDate: string       // ISO string of the most recent sub-line's orderDate
  subLines: SerializedProductionOrder[]
  totalQtySqm: number | null
  totalWeightKgs: number | null
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

    groups.push({ piNumber, customers, orderDate, subLines, totalQtySqm, totalWeightKgs })
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

// ── Sub-line detail table ──────────────────────────────────────────────────────

function SubLineTable({ subLines }: { subLines: SerializedProductionOrder[] }) {
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
              <td className="px-3 py-2 text-center">
                {s.hasEyelet ? (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10">
                    <span className="material-symbols-outlined text-[12px] text-primary">check</span>
                  </span>
                ) : (
                  <span className="text-outline">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-secondary">{s.eyeletColor ?? '—'}</td>
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
  const [search, setSearch] = useState('')
  const [expandedPIs, setExpandedPIs] = useState<Set<string>>(new Set())

  const groups = useMemo(() => groupOrders(orders), [orders])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return groups
    return groups.filter(
      (g) =>
        g.piNumber.toLowerCase().includes(q) ||
        g.customers.some((c) => c.toLowerCase().includes(q)),
    )
  }, [groups, search])

  const togglePI = (piNumber: string) => {
    setExpandedPIs((prev) => {
      const next = new Set(prev)
      if (next.has(piNumber)) next.delete(piNumber)
      else next.add(piNumber)
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
                  onClick={() => togglePI(group.piNumber)}
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
                  <span className="flex items-center gap-1 min-w-[120px]">
                    <span className="font-mono font-semibold text-sm text-primary">
                      {group.piNumber}
                    </span>
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
                    <SubLineTable subLines={group.subLines} />
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
