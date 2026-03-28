import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionService } from '@/services/transaction.service'
import type { TransactionFilters, CreateTransactionInput } from '@/types/transaction.types'

export const useTransactions = (filters: TransactionFilters = {}) =>
  useQuery({
    queryKey: ['transactions', filters],
    queryFn:  () => transactionService.list(filters).then(r => r.data.data!),
  })

export const useTransactionSummary = (month: number, year: number) =>
  useQuery({
    queryKey: ['transactions', 'summary', month, year],
    queryFn:  () => transactionService.summary(month, year).then(r => r.data.data!),
  })

export const useCreateTransaction = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTransactionInput) => transactionService.create(data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })
}

export const useDeleteTransaction = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => transactionService.remove(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })
}