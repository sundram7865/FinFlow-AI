import { useEffect } from 'react'
import { Plus, Trash2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/store/chat.store'
import { chatService } from '@/services/chat.service'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'

export default function ChatSidebar() {
  const {
    chats, activeChatId,
    setChats, setActiveChatId, removeChat, setMessages
  } = useChatStore()

  // Load all conversations on mount
  useEffect(() => {
    chatService.getChats()
      .then(res => setChats(res.data.data ?? []))
      .catch(() => {})
  }, [])

  const handleSelectChat = async (chatId: string) => {
    setActiveChatId(chatId)
    try {
      const res = await chatService.getMessages(chatId, 1, 50)
      setMessages(res.data.data?.messages ?? [])
    } catch { /* ignore */ }
  }

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation()
    await chatService.deleteChat(chatId)
    removeChat(chatId)
    if (activeChatId === chatId) {
      setActiveChatId(null)
      setMessages([])
    }
  }

  return (
    <div className="w-64 border-r flex flex-col h-full bg-card">
      <div className="p-4 border-b">
        <Button
          className="w-full"
          size="sm"
          onClick={() => { setActiveChatId(null); setMessages([]) }}
        >
          <Plus className="h-4 w-4 mr-2" /> New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <p className="text-xs font-medium text-muted-foreground px-2 py-1 uppercase tracking-wide">
          Conversations
        </p>

        {chats.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">No conversations yet</p>
        )}

        {chats.map(chat => (
          <div
            key={chat.chatId}
            onClick={() => handleSelectChat(chat.chatId)}
            className={cn(
              'group flex items-center gap-2 px-3 py-2.5 rounded-md cursor-pointer transition-colors',
              activeChatId === chat.chatId
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-accent text-foreground'
            )}
          >
            <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{chat.title}</p>
              <p className="text-xs text-muted-foreground">{formatDate(chat.createdAt)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
              onClick={e => handleDeleteChat(e, chat.chatId)}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}