import { Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Transaction } from '@/types/transaction.types'
import { formatCurrency, formatDate } from '@/utils/format'
import { useDeleteTransaction } from '@/hooks/useTransactions'
import { cn } from '@/utils/cn'

interface Props { transactions: Transaction[] }

export default function TransactionTable({ transactions }: Props) {
  const { mutate: del } = useDeleteTransaction()

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {transactions.map(tx => (
            <tr key={tx.id} className="border-b hover:bg-muted/30 transition-colors">
              <td className="p-3">
                {tx.type === 'CREDIT'
                  ? <ArrowUpRight className="h-4 w-4 text-green-600" />
                  : <ArrowDownLeft className="h-4 w-4 text-red-600" />
                }
              </td>
              <td className="p-3 max-w-xs truncate">{tx.description ?? '—'}</td>
              <td className="p-3">
                <span className="px-2 py-0.5 rounded-full text-xs bg-secondary capitalize">{tx.category}</span>
              </td>
              <td className="p-3 text-muted-foreground">{formatDate(tx.date)}</td>
              <td className={cn('p-3 text-right font-semibold', tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600')}>
                {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
              </td>
              <td className="p-3">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => del(tx.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}