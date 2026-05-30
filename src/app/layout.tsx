import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SNY Planner — Production Management',
  description: 'Internal production planning tool for SNY factory, Vietnam. Manage orders, machine schedules, and materials.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              {/* Brand */}
              <div className="flex items-center gap-3">
                <span className="text-blue-400 font-bold text-lg tracking-tight">
                  SNY<span className="text-white"> Planner</span>
                </span>
                <span className="hidden sm:inline-block text-xs text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">
                  Phase 1
                </span>
              </div>

              {/* Nav links */}
              <div className="flex items-center gap-1">
                <Link
                  href="/orders"
                  className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Orders
                </Link>
                <Link
                  href="/schedule"
                  className="text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  Schedule
                  <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded px-1 py-0 leading-5">
                    MOCK
                  </span>
                </Link>
                <Link
                  href="/materials"
                  className="text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  Materials
                  <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded px-1 py-0 leading-5">
                    MOCK
                  </span>
                </Link>
              </div>
            </div>
          </nav>
        </header>

        <main className="min-h-screen bg-slate-950">
          {children}
        </main>
      </body>
    </html>
  )
}
