import { useEffect } from 'react'
import { useChatStore } from '@/store/chat.store'
import { chatService } from '@/services/chat.service'
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatWindow  from '@/components/chat/ChatWindow'
import ChatInput   from '@/components/chat/ChatInput'
import type { Anomaly, AgentMemory, ChatMessage } from '@/types/chat.types'

export default function ChatPage() {
  const { addMessage, updateLastMessage, setStreaming, isStreaming, setAnomalies, addMemories } = useChatStore()

  useEffect(() => {
    chatService.getHistory().then(res => {
      const history = res.data.data ?? []
      history.forEach(msg => addMessage(msg))
    }).catch(() => {})
  }, [])

  const handleSend = async (text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date().toISOString() }
    addMessage(userMsg)
    setStreaming(true)

    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', timestamp: new Date().toISOString() }
    addMessage(aiMsg)

    let accumulated = ''

    await chatService.streamChat(
      text,
      (token) => {
        accumulated += token
        // Strip [META] from visible content
        const visible = accumulated.split('\n[META]')[0]
        updateLastMessage(visible)
      },
      (anomalies: Anomaly[], newMemories: AgentMemory[]) => {
        setAnomalies(anomalies)
        addMemories(newMemories)
      },
      () => setStreaming(false)
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6 overflow-hidden">
      <ChatSidebar />
      <div className="flex flex-col flex-1">
        <ChatWindow />
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  )
}