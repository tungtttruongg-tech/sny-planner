import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Materials — SNY Planner',
  description: 'Materials tracking view — mock data only in Phase 1.',
}

export default function MaterialsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Materials</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Yarn and material tracking
        </p>
      </div>

      {/* MOCK banner */}
      <div
        role="alert"
        className="flex items-start gap-3 border border-amber-500/40 bg-amber-500/10 rounded-xl px-5 py-4 mb-8"
      >
        <span className="text-amber-400 text-xl mt-0.5" aria-hidden="true">⚠</span>
        <div>
          <p className="text-amber-300 font-semibold text-sm">
            MOCK — NO CALCULATION LOGIC YET
          </p>
          <p className="text-amber-400/70 text-xs mt-0.5">
            Materials calculation will be implemented in a future sprint. No real data is shown here.
          </p>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="border border-slate-800 rounded-xl bg-slate-900/50 p-12 text-center">
        <div className="text-slate-600 mb-3">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <p className="text-slate-400 font-medium">Materials view not yet implemented</p>
        <p className="text-slate-600 text-sm mt-1">
          Yarn consumption formulas are out of scope for Phase 1
        </p>
      </div>
    </div>
  )
}
