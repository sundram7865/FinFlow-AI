import type { LucideIcon } from 'lucide-react'

interface Props { icon: LucideIcon; title: string; description: string; action?: React.ReactNode }

export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm mb-4 max-w-xs">{description}</p>
      {action}
    </div>
  )
}