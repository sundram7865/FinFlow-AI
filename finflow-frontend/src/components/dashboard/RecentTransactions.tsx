import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { Transaction } from '@/types/transaction.types'
import { CATEGORY_COLORS } from '@/utils/constants'
import { formatCurrency, formatShortDate } from '@/utils/format'
import { cn } from '@/utils/cn'

interface Props { transactions: Transaction[] }

export default function RecentTransactions({ transactions }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {transactions.slice(0, 6).map(tx => (
          <div key={tx.id} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${CATEGORY_COLORS[tx.category]}20` }}>
              {tx.type === 'CREDIT'
                ? <ArrowUpRight className="h-4 w-4 text-green-600" />
                : <ArrowDownLeft className="h-4 w-4 text-red-600" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{tx.description ?? tx.category}</p>
              <p className="text-xs text-muted-foreground">{formatShortDate(tx.date)} · {tx.category}</p>
            </div>
            <span className={cn('text-sm font-semibold', tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600')}>
              {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}