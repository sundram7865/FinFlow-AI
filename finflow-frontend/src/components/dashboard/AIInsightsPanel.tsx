import { AlertTriangle, Brain, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { AgentMemory } from '@/types/chat.types'
import type { AnomalyDoc }  from '@/types/anomaly.types'
import { SEVERITY_COLORS }  from '@/utils/constants'

interface Props {
  anomalies: AnomalyDoc[]
  memories:  AgentMemory[]
}

export default function AIInsightsPanel({ anomalies, memories }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" /> AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {anomalies.length === 0 && memories.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No insights yet. Chat with AI to get started.
          </p>
        )}

        {anomalies.slice(0, 3).map((a) => (
          <div
            key={a._id}
            className={`flex items-start gap-3 p-3 rounded-md border text-sm ${SEVERITY_COLORS[a.severity]}`}
          >
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium capitalize">{a.severity} alert</div>
              <div className="opacity-80">{a.description}</div>
            </div>
          </div>
        ))}

        {memories.slice(0, 2).map((m, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-700"
          >
            <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{m.summary}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}