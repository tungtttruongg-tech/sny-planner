import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Production Orders — SNY Planner',
  description: 'View and manage all SNY production orders.',
}

export default function OrdersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Production Orders</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Manage all SNY production orders
          </p>
        </div>
        <button
          id="btn-new-order"
          disabled
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          title="Coming in Sprint S2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Order
        </button>
      </div>

      {/* Empty state — no data yet */}
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-slate-400 font-medium">No orders yet</p>
        <p className="text-slate-600 text-sm mt-1">
          Order entry form coming in Sprint S2
        </p>
      </div>
    </div>
  )
}
