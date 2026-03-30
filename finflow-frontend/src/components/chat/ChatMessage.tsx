import type { ChatMessage as IChatMessage } from '@/types/chat.types'
import AgentBadge from './AgentBadge'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import ReactMarkdown from 'react-markdown'

interface Props {
  message: IChatMessage
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'group flex gap-3 px-4 py-2 animate-fade-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* ── AI Avatar ── */}
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 shadow-sm mt-0.5 select-none">
          AI
        </div>
      )}

      <div
        className={cn(
          'flex flex-col gap-1',
          isUser ? 'items-end max-w-[72%]' : 'items-start max-w-[80%]'
        )}
      >
        {/* ── Agent Badge ── */}
        {!isUser && message.agentUsed && (
          <AgentBadge agent={message.agentUsed} />
        )}

        {/* ── Bubble ── */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
            isUser
              ? 'bg-violet-600 text-white rounded-br-sm'
              : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-bl-sm'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-base font-bold mb-2 mt-1">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-sm font-semibold mt-5 mb-2 pb-1 border-b border-zinc-100 dark:border-zinc-700 flex items-center gap-1.5">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold mt-3 mb-1">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-3 pl-4 space-y-1 list-disc marker:text-violet-400">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-3 pl-4 space-y-1 list-decimal marker:text-violet-400">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-zinc-900 dark:text-zinc-50">{children}</strong>
                ),
                blockquote: ({ children }) => (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-400 pl-3 pr-2 py-2 rounded-r-lg my-3 text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    {children}
                  </div>
                ),
                code({ node, inline, children, ...props }: any) {
                  return inline ? (
                    <code className="bg-zinc-100 dark:bg-zinc-800 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded text-[12px] font-mono">
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-zinc-950 text-zinc-100 p-3 rounded-lg overflow-x-auto text-xs font-mono my-3">
                      <code {...props}>{children}</code>
                    </pre>
                  )
                },
                hr: () => <hr className="my-3 border-zinc-100 dark:border-zinc-800" />,
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3">
                    <table className="text-xs w-full border-collapse">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="px-3 py-2 text-left font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-1.5 border border-zinc-100 dark:border-zinc-800">{children}</td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* ── Timestamp ── */}
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 px-1">
          {formatDate(message.timestamp)}
        </span>
      </div>

      {/* ── User Avatar ── */}
      {isUser && (
        <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 text-[11px] font-bold flex-shrink-0 mt-0.5 select-none">
          U
        </div>
      )}
    </div>
  )
}