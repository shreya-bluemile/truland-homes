import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

// Desktop-only layout, matching the Figma frames. The ☰ button hides or shows the sidebar.
export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-full flex-col">
      <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="flex flex-1">
        {sidebarOpen && <Sidebar />}
        <main className="min-w-0 flex-1 px-[22px] pb-[34px] pt-[34px]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
