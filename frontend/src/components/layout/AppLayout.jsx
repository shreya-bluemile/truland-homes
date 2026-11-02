import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop)
  const { pathname } = useLocation()

  // On small screens the sidebar is an overlay, so close it after navigating.
  useEffect(() => {
    if (!isDesktop()) setSidebarOpen(false)
  }, [pathname])

  return (
    <div className="flex min-h-full flex-col">
      <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} />
        {sidebarOpen && (
          <div className="fixed inset-0 top-[57px] z-10 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
        )}
        <main className="min-w-0 flex-1 px-[12px] pb-[34px] pt-[24px] sm:px-[22px] sm:pt-[34px]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
