import mongoose, { Document, Schema } from 'mongoose'

export interface IAnomaly extends Document {
  userId:      string
  description: string
  severity:    'low' | 'medium' | 'high'
  detectedAt:  Date
  seen:        boolean
}

const AnomalySchema = new Schema<IAnomaly>(
  {
    userId:      { type: String, required: true, index: true },
    description: { type: String, required: true },
    severity:    { type: String, enum: ['low', 'medium', 'high'], required: true },
    detectedAt:  { type: Date, default: Date.now },
    seen:        { type: Boolean, default: false },
  },
  { timestamps: false }
)

export const Anomaly = mongoose.model<IAnomaly>('Anomaly', AnomalySchema)