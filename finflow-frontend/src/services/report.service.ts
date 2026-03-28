import apiClient from './api.client'
import type{ Upload } from '@/types/upload.types'
import type{ ApiResponse } from '@/types/api.types'

export const uploadService = {
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<ApiResponse<{ uploadId: string }>>('/upload/statement', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  list: () =>
    apiClient.get<ApiResponse<Upload[]>>('/upload'),

  getStatus: (id: string) =>
    apiClient.get<ApiResponse<Upload>>(`/upload/${id}/status`),
}