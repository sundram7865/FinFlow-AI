import apiClient from './api.client'
import type { Transaction, TransactionSummary, CreateTransactionInput, TransactionFilters } from '@/types/transaction.types'
import type { ApiResponse, PaginatedResult } from '@/types/api.types'

export const transactionService = {
  list: (filters: TransactionFilters = {}) =>
    apiClient.get<ApiResponse<PaginatedResult<Transaction>>>('/transactions', { params: filters }),

  summary: (month: number, year: number) =>
    apiClient.get<ApiResponse<TransactionSummary>>('/transactions/summary', { params: { month, year } }),

  create: (data: CreateTransactionInput) =>
    apiClient.post<ApiResponse<Transaction>>('/transactions', data),

  update: (id: string, data: Partial<CreateTransactionInput>) =>
    apiClient.patch<ApiResponse<Transaction>>(`/transactions/${id}`, data),

  remove: (id: string) =>
    apiClient.delete(`/transactions/${id}`),
}