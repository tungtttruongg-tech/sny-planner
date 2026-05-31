'use client'

// src/app/schedule/page.tsx
// M2 — Machine Schedule mock page (R1 light theme).
// "use client" required for useState month navigation. All logic unchanged.
// NOTE: metadata export not allowed in Client Components — root layout title is used.

import { useState } from 'react'

// ── Helpers (unchanged) ───────────────────────────────────────────────────────

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}
function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

const MACHINES = Array.from({ length: 40 }, (_, i) => `M-${String(i + 1).padStart(3, '0')}`)
const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function isWeekend(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month, day).getDay()
  return dow === 0 || dow === 6
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const totalDays = daysInMonth(year, month)
  const days = Array.from({ length: totalDays }, (_, i) => i + 1)

  const goPrev = () => setViewDate(new Date(year, month - 1, 1))
  const goNext = () => setViewDate(new Date(year, month + 1, 1))

  return (
    <div className="px-container-margin py-xl">

      {/* Page header */}
      <div className="mb-lg">
        <h1 className="text-display font-inter font-semibold text-primary tracking-tight">
          Machine schedule
        </h1>
        <p className="text-body-md font-noto text-secondary mt-xs">
          Loom and machine allocation view
        </p>
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
            Scheduling logic will be implemented in a future sprint. No real data is shown here.
          </p>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-md">
        <div className="flex items-center gap-sm">
          <button
            id="btn-prev-month"
            onClick={goPrev}
            aria-label="Previous month"
            className="w-8 h-8 flex items-center justify-center rounded-lg border-[0.5px] border-outline-variant hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <h2 className="text-headline-md font-inter font-semibold text-on-surface w-44 text-center">
            {formatMonthLabel(viewDate)}
          </h2>
          <button
            id="btn-next-month"
            onClick={goNext}
            aria-label="Next month"
            className="w-8 h-8 flex items-center justify-center rounded-lg border-[0.5px] border-outline-variant hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
        <p className="text-label-sm font-inter text-secondary">
          {totalDays} days · {MACHINES.length} machines
        </p>
      </div>

      {/* Schedule grid */}
      <div className="overflow-x-auto rounded-lg border-[0.5px] border-outline-variant bg-surface-container-lowest">
        <table className="border-collapse text-xs">
          <thead>
            <tr className="bg-surface-container border-b-[0.5px] border-outline-variant">
              {/* Machine label header */}
              <th
                scope="col"
                className="sticky left-0 z-10 bg-surface-container border-r-[0.5px] border-outline-variant px-md py-sm text-left text-label-sm font-inter font-medium text-secondary uppercase tracking-widest min-w-[88px]"
              >
                Machine
              </th>
              {/* Day headers */}
              {days.map((day) => {
                const weekend = isWeekend(year, month, day)
                const dow = new Date(year, month, day).getDay()
                return (
                  <th
                    key={day}
                    scope="col"
                    className={`w-8 min-w-[32px] py-1 text-center font-medium border-r-[0.5px] border-outline-variant/60 last:border-r-0 ${
                      weekend ? 'text-outline' : 'text-on-surface-variant'
                    }`}
                  >
                    <div>{day}</div>
                    <div className={`text-[10px] leading-none ${weekend ? 'text-outline-variant' : 'text-outline'}`}>
                      {DAY_ABBR[dow]}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[0.5px] divide-outline-variant/50">
            {MACHINES.map((machine, rowIdx) => (
              <tr
                key={machine}
                className={rowIdx % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container-low/40'}
              >
                {/* Machine label — sticky left */}
                <td
                  className={`sticky left-0 z-10 border-r-[0.5px] border-outline-variant px-md py-1.5 font-mono text-type-mono text-on-surface-variant whitespace-nowrap ${
                    rowIdx % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-[#f8f6f5]'
                  }`}
                >
                  {machine}
                </td>
                {/* Empty day cells */}
                {days.map((day) => {
                  const weekend = isWeekend(year, month, day)
                  return (
                    <td
                      key={day}
                      className={`w-8 h-8 border-r-[0.5px] border-outline-variant/40 last:border-r-0 ${
                        weekend ? 'bg-surface-container/60' : ''
                      }`}
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
      <p className="mt-md text-label-sm font-inter text-outline">
        This is a mock layout. Real scheduling logic will be implemented in Phase 2.
        Weekend columns are shaded.
      </p>
    </div>
  )
}
