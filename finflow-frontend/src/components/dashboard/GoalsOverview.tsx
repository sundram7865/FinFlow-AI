import { Target } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

import type { Goal } from '@/types/goal.types'
import { formatCurrency, formatPercent } from '@/utils/format'
import { cn } from '@/utils/cn'

interface Props { goals: Goal[] }

export default function GoalsOverview({ goals }: Props) {
  const active = goals.filter(g => g.status === 'ACTIVE').slice(0, 4)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {active.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No active goals yet.</p>
        )}
        {active.map(goal => {
          const pct = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)
          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium truncate">{goal.title}</span>
                <span className="text-muted-foreground ml-2">{formatPercent(pct)}</span>
              </div>
              <Progress value={pct} className={cn(pct >= 100 ? '[&>div]:bg-green-500' : pct < 30 ? '[&>div]:bg-red-500' : '')} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(goal.savedAmount)}</span>
                <span>{formatCurrency(goal.targetAmount)}</span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}