export interface AnomalyDoc {
  _id:         string
  userId:      string
  uploadId:    string
  fingerprint: string
  description: string
  severity:    'low' | 'medium' | 'high'
  detectedAt:  string
  seen:        boolean
}

export interface AnomalySummary {
  low:    number
  medium: number
  high:   number
  unseen: number
}