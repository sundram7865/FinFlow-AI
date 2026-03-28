import apiClient from './api.client'
import type { LoginInput, RegisterInput, LoginResponse, User } from '@/types/auth.types'
import type { ApiResponse } from '@/types/api.types'

export const authService = {
  register: (data: RegisterInput) =>
    apiClient.post<ApiResponse<{ user: User }>>('/auth/register', data),

  login: (data: LoginInput) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),

  getMe: () =>
    apiClient.get<ApiResponse<User>>('/auth/me'),

  refresh: (refreshToken: string) =>
    apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', { refreshToken }),
}