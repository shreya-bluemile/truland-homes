import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import PlaceholderPage from './pages/PlaceholderPage'
import QuotationsPage from './features/quotations/QuotationsPage'
import PublicQuotationPage from './features/public/PublicQuotationPage'
import ContractorsPage from './features/contractors/ContractorsPage'
import EmailTemplatesPage from './features/settings/EmailTemplatesPage'
import CategoriesPage from './features/settings/CategoriesPage'
import LotsPage from './features/settings/LotsPage'

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
        <Route path="contractors" element={<ContractorsPage />} />
        <Route path="settings">
          <Route index element={<Navigate to="/settings/email-templates" replace />} />
          <Route path="email-templates" element={<EmailTemplatesPage />} />
          <Route path="contractor-categories" element={<CategoriesPage />} />
          <Route path="lots" element={<LotsPage />} />
        </Route>
        <Route path="*" element={<PlaceholderPage title="Page not found" />} />
      </Route>
    </Routes>
  )
}
