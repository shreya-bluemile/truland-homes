import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import PlaceholderPage from './pages/PlaceholderPage'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="p-8 text-center text-[12px] text-muted">Loading…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

const PLACEHOLDERS = [
  ['dashboard', 'Dashboard'], ['staff', 'Staff'], ['clients', 'Clients'], ['builders', 'Builders'],
  ['templates', 'Templates'], ['councils', 'Councils'], ['schedules', 'Schedules'],
]

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/contractor-quotations" replace />} />
        {PLACEHOLDERS.map(([path, title]) => (
          <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
        ))}
        {/* Module screens are added in the next stage. */}
        <Route path="contractor-quotations" element={<PlaceholderPage title="Contractor Quotations" upcoming />} />
        <Route path="contractors" element={<PlaceholderPage title="Contractors" upcoming />} />
        <Route path="settings/*" element={<PlaceholderPage title="Settings" upcoming />} />
        <Route path="*" element={<PlaceholderPage title="Page not found" />} />
      </Route>
    </Routes>
  )
}
