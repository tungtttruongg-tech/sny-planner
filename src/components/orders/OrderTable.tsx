'use client'

// src/components/orders/OrderTable.tsx
// Client component: renders the production orders table with live search.
// Receives pre-fetched, serialized orders from the Server Component parent.

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { SerializedProductionOrder } from '@/types'

interface OrderTableProps {
  orders: SerializedProductionOrder[]
}

/** Format an ISO date string as DD/MM/YYYY */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Status badge colour mapping */
const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-slate-700 text-slate-300',
  IN_PRODUCTION: 'bg-blue-900/60 text-blue-300',
  DONE: 'bg-emerald-900/60 text-emerald-300',
  CANCELLED: 'bg-red-900/40 text-red-400',
}

export default function OrderTable({ orders }: OrderTableProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return orders
    return orders.filter(
      (o) =>
        o.piNumber.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q),
    )
  }, [orders, query])

  return (
    <div className="space-y-4">
      {/* Search + count bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
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
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
          </span>
          <input
            id="search-orders"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by PI Number or Customer…"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            aria-label="Search orders by PI Number or Customer"
          />
        </div>

        {/* Count */}
        <p className="text-sm text-slate-400 shrink-0">
          Showing{' '}
          <span className="font-semibold text-slate-200">{filtered.length}</span>
          {' '}of{' '}
          <span className="font-semibold text-slate-200">{orders.length}</span>
          {' '}orders
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                PI Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Order Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Width (m)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Length (m)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                GSM
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Color
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-8 h-8 text-slate-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                      />
                    </svg>
                    <span>No orders found</span>
                    {query && (
                      <button
                        onClick={() => setQuery('')}
                        className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr
                  key={`${order.piNumber}-${order.subLineIndex}`}
                  className="bg-slate-950 hover:bg-slate-800/80 transition-colors cursor-pointer"
                  onClick={() => router.push(`/orders/${order.id}`)}
                  role="button"
                  aria-label={`View order ${order.piNumber}`}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/orders/${order.id}`) }}
                >
                  {/* PI Number + sub-line badge */}
                  <td className="px-4 py-3 font-mono text-slate-200 whitespace-nowrap">
                    {order.piNumber}
                    {order.subLineIndex > 0 && (
                      <span className="ml-2 text-xs bg-slate-800 text-slate-400 rounded px-1.5 py-0.5">
                        line {order.subLineIndex + 1}
                      </span>
                    )}
                  </td>
                  {/* Customer */}
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                    {order.customer}
                  </td>
                  {/* Order Date */}
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap tabular-nums">
                    {formatDate(order.orderDate)}
                  </td>
                  {/* Width */}
                  <td className="px-4 py-3 text-right text-slate-300 tabular-nums">
                    {order.widthM.toFixed(1)}
                  </td>
                  {/* Length */}
                  <td className="px-4 py-3 text-right text-slate-300 tabular-nums">
                    {order.lengthM.toLocaleString()}
                  </td>
                  {/* GSM */}
                  <td className="px-4 py-3 text-right text-slate-300 tabular-nums">
                    {order.gsm}
                  </td>
                  {/* Color */}
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-slate-300">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-slate-600 shrink-0"
                        style={{
                          backgroundColor: COLOR_MAP[order.color.toUpperCase()] ?? '#64748b',
                        }}
                        aria-hidden="true"
                      />
                      {order.color}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Simple map of colour names → CSS hex for the colour swatch dot.
 * Falls back to slate-500 for unknown colours.
 */
const COLOR_MAP: Record<string, string> = {
  BLACK: '#1e293b',
  WHITE: '#f1f5f9',
  RED: '#ef4444',
  BLUE: '#3b82f6',
  'NAVY BLUE': '#1e3a5f',
  GREY: '#6b7280',
  'GREY MELANGE': '#9ca3af',
  GREEN: '#22c55e',
  YELLOW: '#eab308',
  ORANGE: '#f97316',
}
