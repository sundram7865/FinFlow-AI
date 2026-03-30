import { useQuery } from '@tanstack/react-query'
import { useTransactionSummary } from './useTransactions'
import { useGoals }              from './useGoals'
import { anomalyService }        from '@/services/anomaly.service'

export const useDashboard = () => {
  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  const summary = useTransactionSummary(month, year)
  const goals   = useGoals()

  const anomalies = useQuery({
    queryKey: ['anomalies', { limit: 5 }],
    queryFn:  () =>
      anomalyService
        .getAnomalies({ limit: 5 })
        .then(r => r.data.data ?? []),
  })

  const anomalySummary = useQuery({
    queryKey: ['anomalies', 'summary'],
    queryFn:  () =>
      anomalyService
        .getSummary()
        .then(r => r.data.data),
  })

  return { summary, goals, anomalies, anomalySummary, month, year }
}