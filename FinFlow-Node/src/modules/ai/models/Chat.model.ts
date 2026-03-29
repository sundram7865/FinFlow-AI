import mongoose, { Document, Schema } from 'mongoose'

export interface IChat extends Document {
  chatId:    string
  userId:    string
  title:     string
  createdAt: Date
  updatedAt: Date
}

const ChatSchema = new Schema<IChat>(
  {
    chatId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    title:  { type: String, default: 'New Chat' },
  },
  { timestamps: true }
)

export const Chat = mongoose.model<IChat>('Chat', ChatSchema)