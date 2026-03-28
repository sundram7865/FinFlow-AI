import { create } from 'zustand'
import type { ChatMessage, Anomaly, AgentMemory } from '@/types/chat.types'

interface ChatStore {
  messages:    ChatMessage[]
  isStreaming: boolean
  anomalies:   Anomaly[]
  memories:    AgentMemory[]
  addMessage:       (msg: ChatMessage) => void
  updateLastMessage: (content: string) => void
  setStreaming:  (v: boolean) => void
  setAnomalies: (a: Anomaly[]) => void
  addMemories:  (m: AgentMemory[]) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages:    [],
  isStreaming: false,
  anomalies:   [],
  memories:    [],
  addMessage:       (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateLastMessage: (content) => set((s) => {
    const msgs = [...s.messages]
    if (msgs.length && msgs[msgs.length - 1].role === 'assistant') {
      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content }
    }
    return { messages: msgs }
  }),
  setStreaming:  (isStreaming) => set({ isStreaming }),
  setAnomalies: (anomalies)   => set({ anomalies }),
  addMemories:  (newMems)     => set((s) => ({ memories: [...s.memories, ...newMems] })),
  clearMessages: ()           => set({ messages: [] }),
}))