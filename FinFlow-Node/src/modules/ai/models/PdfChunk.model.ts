import mongoose, { Document, Schema } from 'mongoose'

export interface IPdfChunk extends Document {
  userId:    string    // references PostgreSQL User.id
  uploadId:  string    // references PostgreSQL Upload.id
  content:   string
  embedding: number[]
  pageNum:   number
  createdAt: Date
}

const PdfChunkSchema = new Schema<IPdfChunk>(
  {
    userId:    { type: String, required: true, index: true },
    uploadId:  { type: String, required: true, index: true },
    content:   { type: String, required: true },
    embedding: { type: [Number], required: true },
    pageNum:   { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// Compound index for fast per-user lookup
PdfChunkSchema.index({ userId: 1, uploadId: 1 })

export const PdfChunk = mongoose.model<IPdfChunk>('PdfChunk', PdfChunkSchema)
