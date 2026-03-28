import { useDashboard } from '@/hooks/useDashboard'
import { useTransactions } from '@/hooks/useTransactions'
import StatsCards          from '@/components/dashboard/StatsCards'
import SpendingTrendChart  from '@/components/dashboard/SpendingTrendChart'
import CategoryBarChart    from '@/components/dashboard/CategoryBarChart'
import ExpensePieChart     from '@/components/dashboard/ExpensePieChart'
import AIInsightsPanel     from '@/components/dashboard/AIInsightsPanel'
import GoalsOverview       from '@/components/dashboard/GoalsOverview'
import RecentTransactions  from '@/components/dashboard/RecentTransactions'
import { CardSkeleton, ChartSkeleton } from '@/components/shared/LoadingSkeleton'
import { useChatStore } from '@/store/chat.store'

export default function DashboardPage() {
  const { summary, goals, anomalies } = useDashboard()
  const { data: recentTxs } = useTransactions({ limit: 6 })
  const { anomalies: chatAnomalies, memories } = useChatStore()

  const allAnomalies = [...(anomalies.data ?? []), ...chatAnomalies].slice(0, 5)

  const trendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
    return { month: d.toLocaleString('en-IN', { month: 'short' }), income: 0, expense: 0 }
  })

  if (summary.isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      <div className="grid grid-cols-2 gap-4"><ChartSkeleton /><ChartSkeleton /></div>
    </div>
  )

  const s = summary.data!

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Your financial overview for this month</p>
      </div>

      <StatsCards summary={s} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SpendingTrendChart data={trendData} />
        <CategoryBarChart   data={s.byCategory} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ExpensePieChart data={s.byCategory} />
        <AIInsightsPanel anomalies={allAnomalies} memories={memories} />
        <GoalsOverview goals={goals.data ?? []} />
      </div>

      <RecentTransactions transactions={recentTxs?.data ?? []} />
    </div>
  )
}