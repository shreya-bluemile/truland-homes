import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import PlaceholderPage from './pages/PlaceholderPage'

const PLACEHOLDERS = [
  ['dashboard', 'Dashboard'], ['staff', 'Staff'], ['clients', 'Clients'], ['builders', 'Builders'],
  ['templates', 'Templates'], ['councils', 'Councils'], ['schedules', 'Schedules'],
]

export default function App() {
  return (
    <Routes>
      {/* No login page: old /login links go straight into the app. */}
      <Route path="/login" element={<Navigate to="/contractor-quotations" replace />} />
      <Route element={<AppLayout />}>
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
