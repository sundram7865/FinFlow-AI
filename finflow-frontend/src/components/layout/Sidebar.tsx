import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, Target,
  ArrowLeftRight, Upload, FileText, TrendingUp
} from 'lucide-react'
import { cn } from '@/utils/cn'

const links = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/chat',         icon: MessageSquare,   label: 'AI Chat'       },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Transactions'  },
  { to: '/goals',        icon: Target,          label: 'Goals'         },
  { to: '/upload',       icon: Upload,          label: 'Upload'        },
  { to: '/reports',      icon: FileText,        label: 'Reports'       },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r bg-card flex flex-col z-40">
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <TrendingUp className="h-6 w-6 text-primary" />
        <span className="font-bold text-lg">FinFlow AI</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}