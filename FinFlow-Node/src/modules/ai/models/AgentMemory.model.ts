import mongoose, { Document, Schema } from 'mongoose'

export interface IMemoryEntry {
  summary: string
  type: 'pattern' | 'preference'
  createdAt: Date
}

export interface IAgentMemory extends Document {
  userId: string       // references PostgreSQL User.id
  memories: IMemoryEntry[]
  updatedAt: Date
}

const MemoryEntrySchema = new Schema<IMemoryEntry>(
  {
    summary:   { type: String, required: true },
    type:      { type: String, enum: ['pattern', 'preference'], required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const AgentMemorySchema = new Schema<IAgentMemory>(
  {
    userId:   { type: String, required: true, unique: true, index: true },
    memories: { type: [MemoryEntrySchema], default: [] },
  },
  { timestamps: true }
)

export const AgentMemory = mongoose.model<IAgentMemory>('AgentMemory', AgentMemorySchema)