import { Navigate, Route, Routes } from 'react-router-dom'
import { Admin } from './components/Admin'
import { LegalPage, Storefront } from './components/Storefront'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Storefront />} />
      <Route path="/villkor" element={<LegalPage page="terms" />} />
      <Route path="/integritet" element={<LegalPage page="privacy" />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
