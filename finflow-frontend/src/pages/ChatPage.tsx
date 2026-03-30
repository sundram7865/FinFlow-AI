import { useChatStore } from '@/store/chat.store'
import { chatService } from '@/services/chat.service'
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatWindow from '@/components/chat/ChatWindow'
import ChatInput from '@/components/chat/ChatInput'
import type { ChatMessage, Anomaly, AgentMemory } from '@/types/chat.types'

export default function ChatPage() {
  const {
    activeChatId, setActiveChatId,
    addMessage, updateLastMessage,
    setStreaming, isStreaming,
    setAnomalies, addMemories,
    addChat,
  } = useChatStore()

  const handleSend = async (text: string) => {
    const currentChatId = activeChatId

    // Optimistic user message
    const userMsg: ChatMessage = {
      messageId: Date.now().toString(),
      chatId:    currentChatId ?? 'pending',
      role:      'user',
      content:   text,
      timestamp: new Date().toISOString(),
    }
    addMessage(userMsg)
    setStreaming(true)

    // Placeholder AI message
    const aiMsg: ChatMessage = {
      messageId: (Date.now() + 1).toString(),
      chatId:    currentChatId ?? 'pending',
      role:      'assistant',
      content:   '',
      timestamp: new Date().toISOString(),
    }
    addMessage(aiMsg)

    // ── Accumulate lines into proper markdown ─────────────
    // Each token from the stream is ONE line of the response.
    // We must join them with \n so ReactMarkdown can parse
    // headings (##), bullets (-), blank lines, etc. correctly.
    const lines: string[] = []

    try {
      await chatService.streamChat(
        text,
        currentChatId,

        // New chat created
        (newChatId: string) => {
          if (!currentChatId) {
            setActiveChatId(newChatId)
            addChat({
              chatId:    newChatId,
              userId:    '',
              title:     text.slice(0, 50),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          }
        },

        // Each streaming token = one line from the response
        (token: string) => {
          // Skip any residual [META] bleed-through
          if (token.startsWith('[META]')) return

          lines.push(token)

          // Join with newline — this is what ReactMarkdown needs
          updateLastMessage(lines.join('\n'))
        },

        // Metadata
        (anomalies: Anomaly[], memories: AgentMemory[]) => {
          setAnomalies(anomalies)
          addMemories(memories)
        },

        // Done
        () => {
          setStreaming(false)
        },
      )
    } catch (error) {
      console.error('Streaming error:', error)
      updateLastMessage('Sorry, something went wrong. Please try again.')
      setStreaming(false)
    }
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