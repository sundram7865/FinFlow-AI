import mongoose, { Document, Schema } from 'mongoose'

export interface IAnomaly extends Document {
  userId:      string
  uploadId:    string
  fingerprint: string
  description: string
  severity:    'low' | 'medium' | 'high'
  detectedAt:  Date
  seen:        boolean
}

const AnomalySchema = new Schema<IAnomaly>(
  {
    userId:      { type: String, required: true, index: true },
    uploadId:    { type: String, required: true, index: true },
    fingerprint: { type: String, required: true },
    description: { type: String, required: true },
    severity:    { type: String, enum: ['low', 'medium', 'high'], required: true },
    detectedAt:  { type: Date, default: Date.now },
    seen:        { type: Boolean, default: false },
  },
  { timestamps: false }
)

// Deduplication — same anomaly from same upload can never duplicate
AnomalySchema.index({ userId: 1, fingerprint: 1, uploadId: 1 }, { unique: true })

// Fast unseen badge count query
AnomalySchema.index({ userId: 1, seen: 1 })

export const Anomaly = mongoose.model<IAnomaly>('Anomaly', AnomalySchema)