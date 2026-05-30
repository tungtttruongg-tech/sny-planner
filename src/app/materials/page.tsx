// src/app/materials/page.tsx
// M3 — Materials mock page.
// Pure Server Component — 100% static data, no DB, no client state.

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Materials — SNY Planner',
  description: 'Materials tracking view — mock data only in Phase 1.',
}

// ── Mock data ─────────────────────────────────────────────────────────────────

type StockStatus = 'OK' | 'LOW' | 'CRITICAL'

interface MockMaterial {
  code: string
  type: string
  stockKg: number
  status: StockStatus
}

const MOCK_MATERIALS: MockMaterial[] = [
  { code: 'MF-PP-01',    type: 'Nhựa MF',       stockKg: 8500, status: 'OK' },
  { code: 'MB-IM-B045',  type: 'Master Batch',   stockKg: 120,  status: 'LOW' },
  { code: 'MB-PF960N',   type: 'Master Batch',   stockKg: 200,  status: 'OK' },
  { code: 'FR-001',      type: 'Fire Retardant',  stockKg: 200,  status: 'LOW' },
  { code: 'UV-PP-01',    type: 'Nhựa UV',         stockKg: 45,   status: 'CRITICAL' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StockStatus, { label: string; cls: string }> = {
  OK:       { label: 'OK',       cls: 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/30' },
  LOW:      { label: 'LOW',      cls: 'bg-amber-900/50   text-amber-300   border border-amber-500/30'   },
  CRITICAL: { label: 'CRITICAL', cls: 'bg-red-900/50     text-red-300     border border-red-500/30'     },
}

function StatusBadge({ status }: { status: StockStatus }) {
  const { label, cls } = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide ${cls}`}>
      {label}
    </span>
  )
}

// ── Summary card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string
  value: number
  accent: string   // Tailwind text-color class
  bgAccent: string // Tailwind bg/border accent
}

function SummaryCard({ label, value, accent, bgAccent }: SummaryCardProps) {
  return (
    <div className={`rounded-xl border ${bgAccent} bg-slate-900/50 px-5 py-4`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MaterialsPage() {
  const total    = MOCK_MATERIALS.length
  const lowCount = MOCK_MATERIALS.filter((m) => m.status === 'LOW').length
  const critCount = MOCK_MATERIALS.filter((m) => m.status === 'CRITICAL').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Materials</h1>
        <p className="text-slate-400 mt-1 text-sm">Yarn and material tracking</p>
      </div>

      {/* MOCK banner */}
      <div
        role="alert"
        className="flex items-start gap-3 border border-amber-500/40 bg-amber-500/10 rounded-xl px-5 py-4 mb-8"
      >
        <span className="text-amber-400 text-xl mt-0.5 shrink-0" aria-hidden="true">⚠</span>
        <div>
          <p className="text-amber-300 font-semibold text-sm">
            MOCK — NO CALCULATION LOGIC YET
          </p>
          <p className="text-amber-400/70 text-xs mt-0.5">
            Materials calculation will be implemented in a future sprint. No real data is shown here.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <SummaryCard
          label="Total Materials"
          value={total}
          accent="text-slate-200"
          bgAccent="border-slate-800"
        />
        <SummaryCard
          label="Low Stock Items"
          value={lowCount}
          accent="text-amber-300"
          bgAccent="border-amber-500/30"
        />
        <SummaryCard
          label="Critical Items"
          value={critCount}
          accent="text-red-300"
          bgAccent="border-red-500/30"
        />
      </div>

      {/* Materials table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Material Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Current Stock (kg)
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {MOCK_MATERIALS.map((mat, idx) => (
              <tr
                key={mat.code}
                className={idx % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/30'}
              >
                <td className="px-4 py-3 font-mono text-slate-200 whitespace-nowrap">
                  {mat.code}
                </td>
                <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                  {mat.type}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                  {mat.stockKg.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={mat.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <p className="mt-4 text-xs text-slate-600">
        This is mock data. Real inventory will be connected in Phase 2.
      </p>
    </div>
  )
}
