// src/components/layout/SideNav.tsx
// Fixed 280px left side navigation bar.
// Server Component — "Production" is hardcoded active (all items link to /orders).

import Link from 'next/link'

const NAV_ITEMS = [
  { icon: 'dashboard',    label: 'Dashboard',  active: false },
  { icon: 'factory',      label: 'Production', active: true  },
  { icon: 'inventory_2',  label: 'Inventory',  active: false },
  { icon: 'assessment',   label: 'Reports',    active: false },
  { icon: 'settings',     label: 'Settings',   active: false },
]

export default function SideNav() {
  return (
    <aside className="fixed left-0 top-[64px] z-40 w-[280px] h-[calc(100vh-64px)] bg-surface-container-low border-r border-[0.5px] border-outline-variant flex flex-col">

      {/* User info */}
      <div className="px-md pt-lg pb-md flex items-center gap-3 border-b border-[0.5px] border-outline-variant">
        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-label-md font-inter font-semibold shrink-0">
          PA
        </div>
        <div className="min-w-0">
          <p className="text-label-md font-inter font-semibold text-on-surface truncate">
            Planner Admin
          </p>
          <p className="text-label-sm font-inter text-secondary truncate">
            SNY VINA Plant
          </p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-sm py-md space-y-xs overflow-y-auto">
        {NAV_ITEMS.map(({ icon, label, active }) => (
          <Link
            key={label}
            href="/orders"
            className={[
              'flex items-center gap-3 px-md py-sm rounded-lg transition-colors',
              active
                ? 'bg-primary-container text-on-primary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
            ].join(' ')}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">{icon}</span>
            <span className="text-label-sm font-inter font-medium">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom version tag */}
      <div className="px-md py-md border-t border-[0.5px] border-outline-variant">
        <p className="text-label-sm font-inter text-outline">v1.0 — Phase 1</p>
      </div>
    </aside>
  )
}
