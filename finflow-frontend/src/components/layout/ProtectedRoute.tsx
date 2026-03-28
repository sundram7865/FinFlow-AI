import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuth = useAuthStore(s => s.isAuth)
  if (!isAuth) return <Navigate to="/login" replace />
  return <>{children}</>
}