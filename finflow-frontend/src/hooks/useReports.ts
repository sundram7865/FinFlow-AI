import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportService } from '@/services/report.service'

export const useReports = () =>
  useQuery({
    queryKey: ['reports'],
    queryFn:  () => reportService.list().then(r => r.data.data!),
  })

export const useGenerateReport = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      reportService.generate(month, year),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  })
}