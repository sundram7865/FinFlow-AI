import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { goalService } from '@/services/goal.service'
import type { CreateGoalInput } from '@/types/goal.types'

export const useGoals = () =>
  useQuery({
    queryKey: ['goals'],
    queryFn:  () => goalService.list().then(r => r.data.data!),
  })

export const useGoalProgress = (id: string) =>
  useQuery({
    queryKey: ['goals', id, 'progress'],
    queryFn:  () => goalService.getProgress(id).then(r => r.data.data!),
    enabled:  !!id,
  })

export const useCreateGoal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateGoalInput) => goalService.create(data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export const useDeleteGoal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => goalService.remove(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}