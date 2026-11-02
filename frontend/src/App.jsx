import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import PlaceholderPage from './pages/PlaceholderPage'
import QuotationsPage from './features/quotations/QuotationsPage'
import PublicQuotationPage from './features/public/PublicQuotationPage'

const PLACEHOLDERS = [
  ['dashboard', 'Dashboard'], ['staff', 'Staff'], ['clients', 'Clients'], ['builders', 'Builders'],
  ['templates', 'Templates'], ['councils', 'Councils'], ['schedules', 'Schedules'],
]

export default function App() {
  return (
    <Routes>
      {/* Contractor upload page from the emailed link: no app chrome. */}
      <Route path="/quote/:token" element={<PublicQuotationPage />} />
      {/* No login page: old /login links go straight into the app. */}
      <Route path="/login" element={<Navigate to="/contractor-quotations" replace />} />
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/contractor-quotations" replace />} />
        {PLACEHOLDERS.map(([path, title]) => (
          <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
        ))}
        <Route path="contractor-quotations" element={<QuotationsPage />} />
        <Route path="contractors" element={<PlaceholderPage title="Contractors" upcoming />} />
        <Route path="settings/*" element={<PlaceholderPage title="Settings" upcoming />} />
        <Route path="*" element={<PlaceholderPage title="Page not found" />} />
      </Route>
    </Routes>
  )
}
