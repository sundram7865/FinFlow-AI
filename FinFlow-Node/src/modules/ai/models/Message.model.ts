import mongoose, { Document, Schema } from 'mongoose'

export interface IMessage extends Document {
  messageId: string
  chatId:    string
  userId:    string
  role:      'user' | 'assistant'
  content:   string
  agentUsed?: string
  timestamp: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    messageId: { type: String, required: true, unique: true },
    chatId:    { type: String, required: true, index: true },
    userId:    { type: String, required: true, index: true },
    role:      { type: String, enum: ['user', 'assistant'], required: true },
    content:   { type: String, required: true },
    agentUsed: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

// Compound index for fast message fetching per chat
MessageSchema.index({ chatId: 1, timestamp: 1 })

export const Message = mongoose.model<IMessage>('Message', MessageSchema)