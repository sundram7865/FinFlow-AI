import { useEffect } from 'react'

import { CheckCircle2, AlertCircle, Loader2, Clock, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useUploads } from '@/hooks/useUpload'
import type { Upload, UploadStatus } from '@/types/upload.types'
import { formatDate } from '@/utils/format'

const STATUS_ICONS: Record<UploadStatus, React.ReactNode> = {
  DONE:       <CheckCircle2 className="h-4 w-4 text-green-500" />,
  FAILED:     <AlertCircle  className="h-4 w-4 text-red-500" />,
  PROCESSING: <Loader2      className="h-4 w-4 text-blue-500 animate-spin" />,
  PENDING:    <Clock        className="h-4 w-4 text-yellow-500" />,
}

const STATUS_BADGE: Record<UploadStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DONE:       'default',
  FAILED:     'destructive',
  PROCESSING: 'secondary',
  PENDING:    'outline',
}

export default function UploadHistory() {
  const { data: uploads = [], refetch } = useUploads()
  const hasProcessing = uploads.some(u => u.status === 'PROCESSING' || u.status === 'PENDING')

  useEffect(() => {
    if (!hasProcessing) return
    const interval = setInterval(refetch, 3000)
    return () => clearInterval(interval)
  }, [hasProcessing, refetch])

  return (
    <div className="space-y-3 mt-6">
      <h3 className="font-semibold">Upload History</h3>
      {uploads.map((upload: Upload) => (
        <div key={upload.id} className="flex items-center gap-3 p-4 rounded-lg border">
          <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{upload.fileName}</p>
            <p className="text-xs text-muted-foreground">{formatDate(upload.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            {STATUS_ICONS[upload.status]}
            <Badge variant={STATUS_BADGE[upload.status]}>{upload.status}</Badge>
          </div>
        </div>
      ))}
      {uploads.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No uploads yet</p>
      )}
    </div>
  )
}