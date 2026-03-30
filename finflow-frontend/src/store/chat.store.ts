import { create } from 'zustand'
import type { IChat, ChatMessage, AgentMemory } from '@/types/chat.types'

// Anomaly type removed from chat store —
// anomalies are fetched from DB via /api/anomalies, never from chat stream

interface ChatStore {
  // Conversations
  chats:         IChat[]
  activeChatId:  string | null

  // Messages for active chat
  messages:      ChatMessage[]
  isStreaming:   boolean

  // AI data — memories only, anomalies removed
  memories:      AgentMemory[]

  // Actions
  setChats:          (chats: IChat[])            => void
  addChat:           (chat: IChat)               => void
  removeChat:        (chatId: string)            => void
  setActiveChatId:   (id: string | null)         => void
  setMessages:       (msgs: ChatMessage[])       => void
  addMessage:        (msg: ChatMessage)          => void
  updateLastMessage: (content: string)           => void
  setStreaming:      (v: boolean)                => void
  addMemories:       (m: AgentMemory[])          => void
  updateChatTitle:   (chatId: string, title: string) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  chats:        [],
  activeChatId: null,
  messages:     [],
  isStreaming:  false,
  memories:     [],

  setChats:        (chats)        => set({ chats }),
  addChat:         (chat)         => set(s => ({ chats: [chat, ...s.chats] })),
  removeChat:      (chatId)       => set(s => ({
    chats:        s.chats.filter(c => c.chatId !== chatId),
    activeChatId: s.activeChatId === chatId ? null : s.activeChatId,
  })),
  setActiveChatId:   (activeChatId) => set({ activeChatId, messages: [] }),
  setMessages:       (messages)     => set({ messages }),
  addMessage:        (msg)          => set(s => ({ messages: [...s.messages, msg] })),
  updateLastMessage: (content)      => set(s => {
    const msgs = [...s.messages]
    if (msgs.length && msgs[msgs.length - 1].role === 'assistant') {
      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content }
    }
    return { messages: msgs }
  }),
  setStreaming:    (isStreaming)          => set({ isStreaming }),
  addMemories:    (newMems)              => set(s => ({ memories: [...s.memories, ...newMems] })),
  updateChatTitle: (chatId, title)       => set(s => ({
    chats: s.chats.map(c => c.chatId === chatId ? { ...c, title } : c),
  })),
}))