// src/app/orders/[id]/page.tsx
// Server Component — fetches a single order by id, serializes, renders OrderDetail.

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import type { SerializedProductionOrder } from '@/types'
import OrderDetail from '@/components/orders/OrderDetail'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Best-effort title — falls back gracefully if DB is unavailable
  try {
    const order = await prisma.productionOrder.findUnique({
      where: { id: params.id },
      select: { piNumber: true },
    })
    if (order) {
      return {
        title: `${order.piNumber} — SNY Planner`,
        description: `View and edit production order ${order.piNumber}`,
      }
    }
  } catch {
    // Swallow — metadata failure should not break the page
  }
  return { title: 'Order Detail — SNY Planner' }
}

// Always fetch fresh data — no caching for detail pages
export const dynamic = 'force-dynamic'

export default async function OrderDetailPage({ params }: Props) {
  // ── Fetch order ─────────────────────────────────────────────────────────────
  let order: SerializedProductionOrder | null = null

  try {
    const raw = await prisma.productionOrder.findUnique({
      where: { id: params.id },
    })

    if (!raw) {
      redirect('/orders')
    }

    // Serialize non-plain types before passing to Client Component
    order = {
      ...raw,
      orderDate: raw.orderDate.toISOString(),
      createdAt: raw.createdAt.toISOString(),
      updatedAt: raw.updatedAt.toISOString(),
      uvPct: raw.uvPct != null ? raw.uvPct.toString() : null,
    }
  } catch (err) {
    // redirect() throws internally — let it propagate
    throw err
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-slate-500">
          <li>
            <Link href="/orders" className="hover:text-slate-300 transition-colors">
              Production Orders
            </Link>
          </li>
          <li aria-hidden="true">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li className="text-slate-300 font-medium font-mono" aria-current="page">
            {order.piNumber}
            {order.subLineIndex > 0 && (
              <span className="ml-2 text-xs bg-slate-800 text-slate-400 rounded px-1.5 py-0.5 font-sans">
                line {order.subLineIndex + 1}
              </span>
            )}
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white font-mono">{order.piNumber}</h1>
        <p className="text-slate-400 mt-1 text-sm">{order.customer}</p>
      </div>

      {/* Detail card */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <OrderDetail order={order} />
      </div>
    </div>
  )
}
