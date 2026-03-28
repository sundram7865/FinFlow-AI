export type UploadStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED'

export interface Upload {
  id:        string
  fileName:  string
  status:    UploadStatus
  parsedAt:  string | null
  createdAt: string
}