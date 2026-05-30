import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Machine Schedule — SNY Planner',
  description: 'Machine schedule view — mock data only in Phase 1.',
}

export default function SchedulePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Machine Schedule</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Loom and machine allocation view
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
            Scheduling logic will be implemented in a future sprint. No real data is shown here.
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-slate-400 font-medium">Schedule view not yet implemented</p>
        <p className="text-slate-600 text-sm mt-1">
          Machine assignment logic is out of scope for Phase 1
        </p>
      </div>
    </div>
  )
}
