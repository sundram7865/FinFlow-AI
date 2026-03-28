import  { useState,type  KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props { onSend: (msg: string) => void; disabled: boolean }

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')

  const handleSend = () => {
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue('')
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="border-t p-4 flex gap-2">
      <Input
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={onKey}
        placeholder="Ask about your finances..."
        disabled={disabled}
        className="flex-1"
      />
      <Button onClick={handleSend} disabled={disabled || !value.trim()} size="icon">
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}