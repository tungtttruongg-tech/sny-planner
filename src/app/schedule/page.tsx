'use client'

// src/app/schedule/page.tsx
// M2 — Machine Schedule mock page.
// "use client" required for useState month navigation.
// NOTE: metadata export is not allowed in Client Components — root layout title is used.

import { useState } from 'react'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the number of days in a given month/year. */
function daysInMonth(year: number, month: number): number {
  // new Date(year, month + 1, 0) = last day of `month`
  return new Date(year, month + 1, 0).getDate()
}

/** Formats a Date as "Month YYYY" for the header label. */
function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

/** Generates machine labels M-001 … M-040. */
const MACHINES = Array.from({ length: 40 }, (_, i) =>
  `M-${String(i + 1).padStart(3, '0')}`,
)

/** Day-of-week abbreviation for a date (Mo/Tu/We/Th/Fr/Sa/Su). */
const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function isWeekend(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month, day).getDay()
  return dow === 0 || dow === 6
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  // Track the 1st of the currently-displayed month
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth() // 0-indexed
  const totalDays = daysInMonth(year, month)
  const days = Array.from({ length: totalDays }, (_, i) => i + 1)

  const goPrev = () => setViewDate(new Date(year, month - 1, 1))
  const goNext = () => setViewDate(new Date(year, month + 1, 1))

  return (
    <div className="max-w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white">Machine Schedule</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Loom and machine allocation view
        </p>
      </div>

      {/* MOCK banner */}
      <div
        role="alert"
        className="flex items-start gap-3 border border-amber-500/40 bg-amber-500/10 rounded-xl px-5 py-4 mb-6 max-w-7xl mx-auto"
      >
        <span className="text-amber-400 text-xl mt-0.5 shrink-0" aria-hidden="true">⚠</span>
        <div>
          <p className="text-amber-300 font-semibold text-sm">
            MOCK — NO CALCULATION LOGIC YET
          </p>
          <p className="text-amber-400/70 text-xs mt-0.5">
            Scheduling logic will be implemented in a future sprint. No real data is shown here.
          </p>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            id="btn-prev-month"
            onClick={goPrev}
            aria-label="Previous month"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h2 className="text-white font-semibold text-base w-44 text-center">
            {formatMonthLabel(viewDate)}
          </h2>

          <button
            id="btn-next-month"
            onClick={goNext}
            aria-label="Next month"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-slate-500">
          {totalDays} days · {MACHINES.length} machines
        </p>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-800">
              {/* Machine label header */}
              <th
                scope="col"
                className="sticky left-0 z-10 bg-slate-900 border-r border-slate-800 px-3 py-2 text-left text-slate-400 font-semibold uppercase tracking-wider min-w-[88px]"
              >
                Machine
              </th>
              {/* Day number headers */}
              {days.map((day) => {
                const weekend = isWeekend(year, month, day)
                const dow = new Date(year, month, day).getDay()
                return (
                  <th
                    key={day}
                    scope="col"
                    className={`w-8 min-w-[32px] py-1 text-center font-medium border-r border-slate-800/60 last:border-r-0
                      ${weekend ? 'text-slate-600' : 'text-slate-400'}`}
                  >
                    <div>{day}</div>
                    <div className={`text-[10px] leading-none ${weekend ? 'text-slate-700' : 'text-slate-600'}`}>
                      {DAY_ABBR[dow]}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {MACHINES.map((machine, rowIdx) => (
              <tr
                key={machine}
                className={rowIdx % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/30'}
              >
                {/* Machine label — sticky left */}
                <td
                  className={`sticky left-0 z-10 border-r border-slate-800 px-3 py-1.5 font-mono text-slate-400 whitespace-nowrap
                    ${rowIdx % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/30'}`}
                >
                  {machine}
                </td>
                {/* Empty day cells */}
                {days.map((day) => {
                  const weekend = isWeekend(year, month, day)
                  return (
                    <td
                      key={day}
                      className={`w-8 h-8 border-r border-slate-800/40 last:border-r-0
                        ${weekend ? 'bg-slate-800/20' : ''}`}
                      aria-label={`${machine} day ${day}`}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <p className="mt-4 text-xs text-slate-600 max-w-7xl mx-auto">
        This is a mock layout. Real scheduling logic will be implemented in Phase 2.
        Weekend columns are shaded.
      </p>
    </div>
  )
}
