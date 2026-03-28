import apiClient from './api.client'
import type { Report } from '@/types/report.types'
import type { ApiResponse } from '@/types/api.types'

export const reportService = {
  list: () =>
    apiClient.get<ApiResponse<Report[]>>('/reports'),

  generate: (month: number, year: number) =>
    apiClient.post<ApiResponse<Report>>('/reports/generate', { month, year }),
}