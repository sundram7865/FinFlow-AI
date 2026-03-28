import apiClient from './api.client'
import type { Goal, GoalProgress, CreateGoalInput } from '@/types/goal.types'
import type { ApiResponse } from '@/types/api.types'

export const goalService = {
  list: () =>
    apiClient.get<ApiResponse<Goal[]>>('/goals'),

  getOne: (id: string) =>
    apiClient.get<ApiResponse<Goal>>(`/goals/${id}`),

  getProgress: (id: string) =>
    apiClient.get<ApiResponse<GoalProgress>>(`/goals/${id}/progress`),

  create: (data: CreateGoalInput) =>
    apiClient.post<ApiResponse<Goal>>('/goals', data),

  update: (id: string, data: Partial<CreateGoalInput> & { savedAmount?: number }) =>
    apiClient.patch<ApiResponse<Goal>>(`/goals/${id}`, data),

  remove: (id: string) =>
    apiClient.delete(`/goals/${id}`),
}