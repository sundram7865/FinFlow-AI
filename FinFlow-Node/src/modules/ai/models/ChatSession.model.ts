import mongoose, { Document, Schema } from 'mongoose'

export interface IMessage {
  role: 'user' | 'assistant'
  content: string
  agentUsed?: string
  timestamp: Date
}

export interface IChatSession extends Document {
  userId: string       // references PostgreSQL User.id
  messages: IMessage[]
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    role:      { type: String, enum: ['user', 'assistant'], required: true },
    content:   { type: String, required: true },
    agentUsed: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
)

const ChatSessionSchema = new Schema<IChatSession>(
  {
    userId:   { type: String, required: true, index: true },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true }
)

export const ChatSession = mongoose.model<IChatSession>('ChatSession', ChatSessionSchema)