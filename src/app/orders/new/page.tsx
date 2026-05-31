// src/app/orders/new/page.tsx
// Server component wrapper — New Order form page (R1 light theme).

import type { Metadata } from 'next'
import Link from 'next/link'
import NewOrderForm from '@/components/orders/NewOrderForm'

export const metadata: Metadata = {
  title: 'New Production Order — SNY Planner',
  description: 'Create a new SNY production order.',
}

export default function NewOrderPage() {
  return (
    <div className="max-w-[800px] mx-auto px-container-margin py-xl">

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-lg">
        <ol className="flex items-center gap-sm text-label-md font-inter text-on-surface-variant">
          <li>
            <Link href="/orders" className="hover:text-primary transition-colors">
              Production orders
            </Link>
          </li>
          <li aria-hidden="true">
            <span className="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
          </li>
          <li className="text-on-surface font-medium" aria-current="page">
            New order
          </li>
        </ol>
      </nav>

      {/* Page title */}
      <h1 className="text-headline-lg font-inter font-semibold text-on-surface mb-lg">
        New production order
      </h1>

      {/* Form card */}
      <div className="bg-surface-container-lowest border-[0.5px] border-outline-variant rounded-lg p-lg md:p-[32px]">
        <NewOrderForm />
      </div>
    </div>
  )
}
