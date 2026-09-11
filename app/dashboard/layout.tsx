'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopBar } from '@/components/dashboard/top-bar'
import { BottomNav } from '@/components/dashboard/bottom-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-[100dvh] bg-background text-foreground overflow-hidden">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain scrollbar-hide p-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
