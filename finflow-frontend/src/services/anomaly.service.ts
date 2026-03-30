import apiClient from './api.client'
import type { ApiResponse } from '@/types/api.types'
import type { AnomalyDoc, AnomalySummary } from '@/types/anomaly.types'

export const anomalyService = {
  // GET /api/anomalies?severity=high&seen=false&limit=20&offset=0
  getAnomalies: (params?: {
    severity?: 'low' | 'medium' | 'high'
    seen?:     boolean
    from?:     string
    to?:       string
    limit?:    number
    offset?:   number
  }) =>
    apiClient.get<ApiResponse<AnomalyDoc[]>>('/anomalies', { params }),

  // GET /api/anomalies/summary → { low, medium, high, unseen }
  getSummary: () =>
    apiClient.get<ApiResponse<AnomalySummary>>('/anomalies/summary'),

  // PATCH /api/anomalies/:id/seen
  markSeen: (id: string) =>
    apiClient.patch(`/anomalies/${id}/seen`),

  // PATCH /api/anomalies/seen-all
  markAllSeen: () =>
    apiClient.patch('/anomalies/seen-all'),

  // DELETE /api/anomalies/upload/:uploadId
  deleteByUpload: (uploadId: string) =>
    apiClient.delete(`/anomalies/upload/${uploadId}`),
}