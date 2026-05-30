// src/app/orders/new/page.tsx
// Server component wrapper for the New Order form page.

import type { Metadata } from 'next'
import Link from 'next/link'
import NewOrderForm from '@/components/orders/NewOrderForm'

export const metadata: Metadata = {
  title: 'New Production Order — SNY Planner',
  description: 'Create a new SNY production order.',
}

export default function NewOrderPage() {
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
          <li className="text-slate-300 font-medium" aria-current="page">
            New Order
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">New Production Order</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Fill in the required fields and click Save Order to create a new order.
        </p>
      </div>

      {/* Form card */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <NewOrderForm />
      </div>
    </div>
  )
}
