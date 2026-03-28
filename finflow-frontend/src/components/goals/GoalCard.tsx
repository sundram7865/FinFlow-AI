import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import type { Goal } from '@/types/goal.types'
import { formatCurrency, formatDate, formatPercent } from '@/utils/format'
import { useDeleteGoal } from '@/hooks/useGoals'
import MilestoneTimeline from './MilestoneTimeline'
import { cn } from '@/utils/cn'

interface Props { goal: Goal }

const STATUS_COLORS = {
  ACTIVE:    'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED:    'bg-red-100 text-red-700',
}

export default function GoalCard({ goal }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { mutate: del } = useDeleteGoal()
  const pct = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold">{goal.title}</h3>
            {goal.description && <p className="text-sm text-muted-foreground mt-0.5">{goal.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[goal.status]}`}>
              {goal.status}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => del(goal.id)}>
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <Progress value={pct} className={cn('mb-2', pct >= 100 ? '[&>div]:bg-green-500' : '')} />

        <div className="flex justify-between text-sm text-muted-foreground mb-3">
          <span>{formatCurrency(goal.savedAmount)} saved</span>
          <span>{formatPercent(pct)} of {formatCurrency(goal.targetAmount)}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Deadline: {formatDate(goal.deadline)}</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setExpanded(!expanded)}>
            Milestones {expanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>
        </div>

        {expanded && <MilestoneTimeline milestones={goal.milestones} />}
      </CardContent>
    </Card>
  )
}