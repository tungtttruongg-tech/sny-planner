// src/app/materials/page.tsx
// M3 — Materials mock page (R1 light theme). Pure Server Component — logic unchanged.

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Materials — SNY Planner',
  description: 'Materials tracking view — mock data only in Phase 1.',
}

// ── Mock data (unchanged) ─────────────────────────────────────────────────────

type StockStatus = 'OK' | 'LOW' | 'CRITICAL'

interface MockMaterial {
  code: string; type: string; stockKg: number; status: StockStatus
}

const MOCK_MATERIALS: MockMaterial[] = [
  { code: 'MF-PP-01',   type: 'Nhựa MF',        stockKg: 8500, status: 'OK'       },
  { code: 'MB-IM-B045', type: 'Master Batch',    stockKg: 120,  status: 'LOW'      },
  { code: 'MB-PF960N',  type: 'Master Batch',    stockKg: 200,  status: 'OK'       },
  { code: 'FR-001',     type: 'Fire Retardant',  stockKg: 200,  status: 'LOW'      },
  { code: 'UV-PP-01',   type: 'Nhựa UV',         stockKg: 45,   status: 'CRITICAL' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StockStatus, { label: string; cls: string }> = {
  OK:       { label: 'OK',       cls: 'bg-[#f0fdf4] text-[#15803d] border border-[#22c55e]/30' },
  LOW:      { label: 'LOW',      cls: 'bg-[#FFF8E7] text-[#92400E] border border-[#F59E0B]/40' },
  CRITICAL: { label: 'CRITICAL', cls: 'bg-error-container text-error border border-error/30'    },
}

function StatusBadge({ status }: { status: StockStatus }) {
  const { label, cls } = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center px-sm py-xs rounded text-label-sm font-inter font-semibold tracking-wide ${cls}`}>
      {label}
    </span>
  )
}

// ── Summary card ──────────────────────────────────────────────────────────────

interface SummaryCardProps { label: string; value: number; accent: string; border: string }

function SummaryCard({ label, value, accent, border }: SummaryCardProps) {
  return (
    <div className={`bg-surface-container-lowest border-[0.5px] ${border} rounded-xl px-lg py-md`}>
      <p className="text-label-sm font-inter font-medium text-secondary uppercase tracking-widest mb-sm">{label}</p>
      <p className={`text-headline-lg font-inter font-semibold tabular-nums ${accent}`}>{value}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MaterialsPage() {
  const total    = MOCK_MATERIALS.length
  const lowCount = MOCK_MATERIALS.filter((m) => m.status === 'LOW').length
  const critCount = MOCK_MATERIALS.filter((m) => m.status === 'CRITICAL').length

  return (
    <div className="max-w-[1440px] mx-auto px-container-margin py-xl">

      {/* Page header */}
      <div className="mb-lg">
        <h1 className="text-display font-inter font-semibold text-primary tracking-tight">Materials</h1>
        <p className="text-body-md font-noto text-secondary mt-xs">Yarn and material tracking</p>
      </div>

      {/* MOCK banner — amber light theme */}
      <div
        role="alert"
        className="flex items-start gap-sm border border-[#F59E0B] bg-[#FFF8E7] rounded-lg px-md py-sm mb-lg"
      >
        <span className="material-symbols-outlined text-[20px] text-[#92400E] shrink-0 mt-0.5">warning</span>
        <div>
          <p className="text-label-md font-inter font-semibold text-[#92400E]">
            MOCK — NO CALCULATION LOGIC YET
          </p>
          <p className="text-label-sm font-inter text-[#92400E]/80 mt-0.5">
            Materials calculation will be implemented in a future sprint. No real data is shown here.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md mb-lg">
        <SummaryCard label="Total Materials" value={total}    accent="text-on-surface"    border="border-outline-variant" />
        <SummaryCard label="Low Stock Items" value={lowCount} accent="text-[#92400E]"     border="border-[#F59E0B]/40"   />
        <SummaryCard label="Critical Items"  value={critCount} accent="text-error"         border="border-error/30"       />
      </div>

      {/* Materials table */}
      <div className="bg-surface-container-lowest border-[0.5px] border-outline-variant rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-container border-b-[0.5px] border-outline-variant">
              {['Material Code', 'Type', 'Current Stock (kg)', 'Status'].map((h, i) => (
                <th
                  key={h}
                  className={`px-md py-sm text-label-sm font-inter font-medium text-secondary uppercase tracking-widest ${
                    i === 2 ? 'text-right' : 'text-left'
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[0.5px] divide-outline-variant">
            {MOCK_MATERIALS.map((mat, idx) => (
              <tr
                key={mat.code}
                className={idx % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container-low/40'}
              >
                <td className="px-md py-sm font-mono text-type-mono text-on-surface whitespace-nowrap">{mat.code}</td>
                <td className="px-md py-sm text-body-md font-noto text-on-surface whitespace-nowrap">{mat.type}</td>
                <td className="px-md py-sm text-right font-mono text-type-mono text-on-surface tabular-nums">
                  {mat.stockKg.toLocaleString()}
                </td>
                <td className="px-md py-sm"><StatusBadge status={mat.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t-[0.5px] border-outline-variant px-md py-sm bg-surface-container">
          <p className="text-label-sm font-inter text-secondary">
            Mock data — {MOCK_MATERIALS.length} materials. Real inventory connected in Phase 2.
          </p>
        </div>
      </div>
    </div>
  )
}
