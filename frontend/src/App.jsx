import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import PlaceholderPage from './pages/PlaceholderPage'
import UploadQuotationPage from './pages/public/UploadQuotationPage'
import QuotationsPage from './pages/quotations/QuotationsPage'

const PLACEHOLDERS = [
  ['dashboard', 'Dashboard'], ['staff', 'Staff'], ['clients', 'Clients'], ['builders', 'Builders'],
  ['templates', 'Templates'], ['councils', 'Councils'], ['schedules', 'Schedules'],
]

export default function App() {
  return (
    <Routes>
      {/* No login page: old /login links go straight into the app. */}
      <Route path="/login" element={<Navigate to="/contractor-quotations" replace />} />
      {/* Contractors open this from the quotation email; it sits outside the staff layout. */}
      <Route path="/quote/:token" element={<UploadQuotationPage />} />
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
