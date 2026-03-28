import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import  { uploadService } from '@/services/upload.service'

export const useUploads = () =>
  useQuery({
    queryKey: ['uploads'],
    queryFn:  () => uploadService.list().then(r => r.data.data!),
  })

export const useUploadStatement = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadService.upload(file),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['uploads'] }),
  })
}