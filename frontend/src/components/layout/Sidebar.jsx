import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Menu order and labels follow the Figma sidebar. Modules outside this project link to placeholder pages.
const MENU = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Staff', to: '/staff', dropdown: true },
  { label: 'Clients', to: '/clients' },
  { label: 'Builders', to: '/builders' },
  { label: 'Templates', to: '/templates', dropdown: true },
  { label: 'Councils', to: '/councils', dropdown: true },
  { label: 'Schedules', to: '/schedules' },
  {
    label: 'Settings',
    children: [
      { label: 'Email Templates', to: '/settings/email-templates' },
      { label: 'Contractor Categories', to: '/settings/contractor-categories' },
      { label: 'Lots', to: '/settings/lots' },
    ],
  },
  { label: 'Contractor Quotations', to: '/contractor-quotations' },
  { label: 'Contractors', to: '/contractors' },
]

const itemBase = 'flex h-[29px] w-full items-center gap-[11px] whitespace-nowrap px-[17px] text-left text-[12px]'
const Slot = () => <span className="h-[15px] w-[13px] shrink-0" aria-hidden="true" />

export default function Sidebar({ open, onNavigate }) {
  const { logout } = useAuth()
  const { pathname } = useLocation()
  const [expanded, setExpanded] = useState(() => (pathname.startsWith('/settings') ? 'Settings' : null))

  return (
    <aside
      className={`fixed bottom-0 left-0 top-[57px] z-20 w-[193px] shrink-0 overflow-y-auto border-r-[0.909px] border-line-side bg-white py-[8px] transition-transform lg:sticky lg:h-[calc(100vh-57px)] ${
        open ? 'translate-x-0' : '-translate-x-full lg:hidden'
      }`}
    >
      <nav aria-label="Main">
        {MENU.map((item) =>
          item.children ? (
            <div key={item.label}>
              <button
                type="button"
                className={`${itemBase} ${pathname.startsWith('/settings') ? 'font-bold text-brand' : 'text-muted-nav'}`}
                aria-expanded={expanded === item.label}
                onClick={() => setExpanded(expanded === item.label ? null : item.label)}
              >
                <Slot />
                {item.label} ⌄
              </button>
              {expanded === item.label &&
                item.children.map((child) => (
                  <NavLink
                    key={child.to}
                    to={child.to}
                    onClick={onNavigate}
                    className={({ isActive }) => `${itemBase} pl-[41px] ${isActive ? 'font-bold text-brand' : 'text-muted-nav'}`}
                  >
                    {child.label}
                  </NavLink>
                ))}
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) => `${itemBase} ${isActive ? 'font-bold text-brand' : 'text-muted-nav'}`}
            >
              <Slot />
              {item.label}
              {item.dropdown && ' ⌄'}
            </NavLink>
          ),
        )}
        <button type="button" onClick={logout} className={`${itemBase} text-muted-nav`}>
          <Slot />
          Logout
        </button>
      </nav>
    </aside>
  )
}
