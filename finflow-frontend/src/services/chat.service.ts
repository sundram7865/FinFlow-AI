import { API_URL } from '@/utils/constants'
import { useAuthStore } from '@/store/auth.store'
import type { ChatMessage, Anomaly, AgentMemory } from '@/types/chat.types'
import apiClient from './api.client'
import type { ApiResponse } from '@/types/api.types'

export const chatService = {
  getHistory: () =>
    apiClient.get<ApiResponse<ChatMessage[]>>('/ai/history'),

  clearHistory: () =>
    apiClient.delete('/ai/history'),

  getAnomalies: () =>
    apiClient.get<ApiResponse<Anomaly[]>>('/ai/anomalies'),

  markAnomalySeen: (id: string) =>
    apiClient.patch(`/ai/anomalies/${id}/seen`),

  streamChat: async (
    message: string,
    onToken: (token: string) => void,
    onMeta:  (anomalies: Anomaly[], memories: AgentMemory[]) => void,
    onDone:  () => void,
  ) => {
    const token = useAuthStore.getState().accessToken
    const res   = await fetch(`${API_URL}/ai/chat`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    })

    if (!res.ok) throw new Error(`Chat error: ${res.status}`)

    const reader  = res.body!.getReader()
    const decoder = new TextDecoder()
    let   buffer  = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value)

      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') { onDone(); return }
        if (data.includes('[META]')) {
          try {
            const json = data.substring(data.indexOf('{'))
            const meta = JSON.parse(json)
            onMeta(meta.anomalies ?? [], meta.new_memories ?? [])
          } catch { /* ignore */ }
        } else {
          onToken(data)
        }
      }
    }
    onDone()
  },
}