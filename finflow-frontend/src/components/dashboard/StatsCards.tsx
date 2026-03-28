import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/utils/format'
import type { TransactionSummary } from '@/types/transaction.types'

interface Props { summary: TransactionSummary; prevSummary?: TransactionSummary }

export default function StatsCards({ summary }: Props) {
  const growthPct = summary.totalIncome > 0
    ? (((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100).toFixed(1)
    : '0'

  const stats = [
    { label: 'Total Income',   value: summary.totalIncome,  icon: TrendingUp,   color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Total Expense',  value: summary.totalExpense, icon: TrendingDown, color: 'text-red-600',    bg: 'bg-red-50'   },
    { label: 'Net Savings',    value: summary.balance,      icon: PiggyBank,    color: 'text-blue-600',   bg: 'bg-blue-50'  },
    { label: 'Savings Rate',   value: null,                 icon: Wallet,       color: 'text-purple-600', bg: 'bg-purple-50', custom: `${growthPct}%` },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color, bg, custom }) => (
        <Card key={label}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
              <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${value !== null && value < 0 ? 'text-red-600' : ''}`}>
              {custom ?? formatCurrency(value ?? 0)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}