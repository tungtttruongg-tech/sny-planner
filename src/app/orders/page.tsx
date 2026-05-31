// src/app/orders/page.tsx
// Server Component — fetches all production orders from DB and renders the list.
// No "use client" — this runs only on the server.

import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import type { SerializedProductionOrder } from '@/types'
import OrderTable from '@/components/orders/OrderTable'
import ImportOrdersModal from '@/components/orders/ImportOrdersModal'

export const metadata: Metadata = {
  title: 'Production Orders — SNY Planner',
  description: 'View and manage all SNY production orders.',
}

// Opt out of caching so the page always reflects the latest DB state.
export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  // ── Fetch from DB ──────────────────────────────────────────────────────────
  let orders: SerializedProductionOrder[] = []
  let fetchError: string | null = null

  try {
    const raw = await prisma.productionOrder.findMany({
      orderBy: { orderDate: 'desc' },
    })

    // Serialise Date objects → ISO strings before passing to the Client Component.
    // Next.js 14 requires props to Client Components to be plain, JSON-serializable
    // values. Passing a Date object directly causes a runtime warning.
    orders = raw.map((o) => ({
      ...o,
      orderDate: o.orderDate.toISOString(),
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      // Prisma.Decimal is not JSON-serializable — convert to string (or null)
      uvPct: o.uvPct != null ? o.uvPct.toString() : null,
    }))
  } catch (err) {
    console.error('[OrdersPage] DB fetch failed:', err)
    fetchError =
      err instanceof Error ? err.message : 'Unknown database error'
  }

  // ── Render ─────────────────────────────────────────────────────────────────
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

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Import Excel */}
          <ImportOrdersModal />

          {/* New Order */}
          <Link
            id="btn-new-order"
            href="/orders/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
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
          </Link>
        </div>
      </div>

      {/* DB error banner */}
      {fetchError && (
        <div
          role="alert"
          className="flex items-start gap-3 border border-red-500/40 bg-red-500/10 rounded-xl px-5 py-4 mb-8"
        >
          <span className="text-red-400 text-xl mt-0.5" aria-hidden="true">
            ✕
          </span>
          <div>
            <p className="text-red-300 font-semibold text-sm">
              Could not load orders
            </p>
            <p className="text-red-400/70 text-xs mt-0.5 font-mono">
              {fetchError}
            </p>
            <p className="text-slate-500 text-xs mt-2">
              Make sure DATABASE_URL is set in .env.local and{' '}
              <code className="text-slate-400">npx prisma db push</code> has
              been run.
            </p>
          </div>
        </div>
      )}

      {/* Orders table — only rendered when fetch succeeded */}
      {!fetchError && <OrderTable orders={orders} />}
    </div>
  )
}
