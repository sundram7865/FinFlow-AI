import { CheckCircle2, Circle } from 'lucide-react'
import type { Milestone } from '@/types/goal.types'
import { formatCurrency, formatDate } from '@/utils/format'

interface Props { milestones: Milestone[] }

export default function MilestoneTimeline({ milestones }: Props) {
  return (
    <div className="space-y-3 mt-4">
      {milestones.map(m => (
        <div key={m.id} className="flex items-center gap-3 text-sm">
          {m.achieved
            ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            : <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          }
          <div className="flex-1">
            <span className="font-medium">Week {m.weekNumber}</span>
            <span className="text-muted-foreground ml-2">Save {formatCurrency(m.targetSave)}</span>
          </div>
          <span className="text-muted-foreground">{formatDate(m.dueDate)}</span>
        </div>
      ))}
    </div>
  )
}