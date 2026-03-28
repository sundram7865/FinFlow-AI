import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout      from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import LoginPage      from '@/pages/auth/LoginPage'
import RegisterPage   from '@/pages/auth/RegisterPage'
import DashboardPage  from '@/pages/DashboardPage'
import ChatPage       from '@/pages/ChatPage'
import TransactionsPage from '@/pages/TransactionsPage'
import GoalsPage      from '@/pages/GoalsPage'
import UploadPage     from '@/pages/UploadPage'
import ReportsPage    from '@/pages/ReportsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard"    element={<DashboardPage />} />
          <Route path="/chat"         element={<ChatPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/goals"        element={<GoalsPage />} />
          <Route path="/upload"       element={<UploadPage />} />
          <Route path="/reports"      element={<ReportsPage />} />
          <Route path="*"             element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="/"         element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}