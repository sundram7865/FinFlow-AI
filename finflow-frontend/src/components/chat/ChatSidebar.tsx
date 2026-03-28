import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/store/chat.store'


export default function ChatSidebar() {
  const { messages, clearMessages } = useChatStore()
  const userMessages = messages.filter(m => m.role === 'user').slice(-5).reverse()

  return (
    <div className="w-64 border-r flex flex-col h-full">
      <div className="p-4 border-b">
        <Button className="w-full" size="sm" onClick={clearMessages}>
          <Plus className="h-4 w-4 mr-2" /> New Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <p className="text-xs font-medium text-muted-foreground px-2 py-1">Recent</p>
        {userMessages.map((msg, i) => (
          <div key={i} className="px-3 py-2 rounded-md hover:bg-accent cursor-pointer text-sm truncate">
            {msg.content.slice(0, 40)}...
          </div>
        ))}
      </div>
      <div className="p-4 border-t">
        <Button variant="ghost" size="sm" className="w-full text-destructive" onClick={clearMessages}>
          <Trash2 className="h-4 w-4 mr-2" /> Clear history
        </Button>
      </div>
    </div>
  )
}