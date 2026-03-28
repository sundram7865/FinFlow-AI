import type { ChatMessage as IChatMessage } from '@/types/chat.types'
import AgentBadge from './AgentBadge'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'

interface Props { message: IChatMessage }

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3 animate-fade-in', isUser && 'justify-end')}>
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
          AI
        </div>
      )}
      <div className={cn('max-w-[75%] space-y-1', isUser && 'items-end flex flex-col')}>
        {!isUser && message.agentUsed && (
          <AgentBadge agent={message.agentUsed} />
        )}
        <div className={cn(
          'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted rounded-tl-sm'
        )}>
          {message.content}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDate(message.timestamp)}
        </span>
      </div>
    </div>
  )
}