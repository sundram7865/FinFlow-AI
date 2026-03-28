import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import type { TransactionSummary as ITransactionSummary } from '@/types/transaction.types'
import { formatCurrency } from '@/utils/format'

interface Props { summary: ITransactionSummary }

export default function TransactionSummary({ summary }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[
        { label: 'Income',   value: summary.totalIncome,  icon: TrendingUp,   color: 'text-green-600' },
        { label: 'Expense',  value: summary.totalExpense, icon: TrendingDown, color: 'text-red-600'   },
        { label: 'Balance',  value: summary.balance,      icon: Wallet,       color: 'text-blue-600'  },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="rounded-lg border p-4 flex items-center gap-3">
          <Icon className={`h-5 w-5 ${color}`} />
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`font-bold text-lg ${value < 0 ? 'text-red-600' : ''}`}>{formatCurrency(value)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}