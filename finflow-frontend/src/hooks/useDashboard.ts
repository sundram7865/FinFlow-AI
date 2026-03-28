import { useTransactionSummary } from './useTransactions'
import { useGoals } from './useGoals'
import { useQuery } from '@tanstack/react-query'
import { chatService } from '@/services/chat.service'

export const useDashboard = () => {
  const now     = new Date()
  const month   = now.getMonth() + 1
  const year    = now.getFullYear()
  const summary = useTransactionSummary(month, year)
  const goals   = useGoals()
  const anomalies = useQuery({
    queryKey: ['anomalies'],
    queryFn:  () => chatService.getAnomalies().then(r => r.data.data ?? []),
  })

  return { summary, goals, anomalies, month, year }
}