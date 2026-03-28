import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'
import { useLogout } from '@/hooks/useAuth'

export default function Navbar() {
  const user       = useAuthStore(s => s.user)
  const { mutate: logout } = useLogout()

  return (
    <header className="fixed top-0 left-64 right-0 h-16 border-b bg-card flex items-center justify-between px-6 z-30">
      <div />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-medium">{user?.name ?? user?.email}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => logout()}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}