import { useEffect, useRef } from 'react'
import { useChatStore } from '@/store/chat.store'
import ChatMessage from './ChatMessage'
import { Skeleton } from '@/components/ui/skeleton'

export default function ChatWindow() {
  const { messages, isStreaming } = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center py-20">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-primary">AI</span>
          </div>
          <h3 className="font-semibold text-lg mb-2">FinFlow AI Assistant</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            Ask me anything about your finances. I can analyse expenses, give advice, and help you plan your goals.
          </p>
        </div>
      )}
      {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
      {isStreaming && (
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">AI</div>
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}