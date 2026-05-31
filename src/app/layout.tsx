// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter, Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import TopNav from '@/components/layout/TopNav'
import SideNav from '@/components/layout/SideNav'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const noto = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SNY Planner — Production Management',
  description: 'Internal production planning tool for SNY factory, Vietnam.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${noto.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className="font-inter">
        <TopNav />
        <SideNav />
        <main className="pl-[280px] pt-[64px] min-h-screen bg-background">
          {children}
        </main>
      </body>
    </html>
  )
}
