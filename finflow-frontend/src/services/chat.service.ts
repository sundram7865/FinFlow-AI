import { API_URL } from '@/utils/constants'
import { useAuthStore } from '@/store/auth.store'
import type { IChat, ChatMessage, AgentMemory } from '@/types/chat.types'
import apiClient from './api.client'
import type { ApiResponse } from '@/types/api.types'

// Anomaly type removed from chat service imports —
// anomalies are fetched via anomalyService, never from the chat stream

export const chatService = {
  // ─── CHATS ──────────────────────────────────────────────
  getChats: () =>
    apiClient.get<ApiResponse<IChat[]>>('/ai/chats'),

  getMessages: (chatId: string, page = 1, limit = 20) =>
    apiClient.get<ApiResponse<{
      messages:   ChatMessage[]
      total:      number
      page:       number
      totalPages: number
    }>>(`/ai/chats/${chatId}/messages`, { params: { page, limit } }),

  deleteChat: (chatId: string) =>
    apiClient.delete(`/ai/chats/${chatId}`),

  // ─── STREAM ─────────────────────────────────────────────
  streamChat: async (
    message:  string,
    chatId:   string | null,
    onChatId: (chatId: string) => void,
    onToken:  (token: string) => void,
    onMeta:   (memories: AgentMemory[]) => void,  // ✅ anomalies removed
    onDone:   () => void,
  ) => {
    const token = useAuthStore.getState().accessToken

    const res = await fetch(`${API_URL}/ai/chat`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify({ message, chatId }),
    })

    if (!res.ok) throw new Error(`Chat error: ${res.status}`)

    const responseChatId = res.headers.get('X-Chat-Id')
    if (responseChatId) onChatId(responseChatId)

    const reader  = res.body!.getReader()
    const decoder = new TextDecoder()
    let   buffer  = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const blocks = buffer.split('\n\n')
      buffer = blocks.pop() ?? ''

      for (const block of blocks) {
        const lines = block.split('\n')

        let eventType = 'message'
        let dataLine  = ''

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            dataLine = line.slice(5)
            if (dataLine.startsWith(' ')) dataLine = dataLine.slice(1)
          }
        }

        if (!dataLine) continue

        if (dataLine === '[DONE]') {
          onDone()
          return
        }

        if (eventType === 'meta' || dataLine.startsWith('[META]')) {
          try {
            const jsonStr = dataLine.startsWith('[META]')
              ? dataLine.slice(6)
              : dataLine
            const meta = JSON.parse(jsonStr)
            // ✅ only memories from stream — anomalies come from DB
            onMeta(meta.new_memories ?? [])
          } catch { /* ignore malformed meta */ }
          continue
        }

        onToken(dataLine)
      }
    }

    onDone()
  },
}