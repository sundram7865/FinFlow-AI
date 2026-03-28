
import { AGENT_LABELS, AGENT_COLORS } from '@/utils/constants'
import type { AgentType } from '@/types/chat.types'

export default function AgentBadge({ agent }: { agent: AgentType }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${AGENT_COLORS[agent]}`}>
      {AGENT_LABELS[agent]}
    </span>
  )
}