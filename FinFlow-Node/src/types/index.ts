import { Request } from 'express'


// ─── JWT PAYLOAD ──────────────────────────────────────────────────────────────
export type Role = 'USER' | 'ADMIN'
export interface JwtPayload {
  userId: string
  email: string
  role: Role
}

// ─── AUTHENTICATED REQUEST ───────────────────────────────────────────────────

export interface AuthRequest extends Request {
  user?: JwtPayload
}

// ─── API RESPONSE ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

// ─── PAGINATION ───────────────────────────────────────────────────────────────

export interface PaginationQuery {
  page?: string
  limit?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ─── PYTHON BRIDGE ────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  agentUsed?: string
  timestamp: Date
}

export interface AgentMemory {
  summary: string
  type: 'pattern' | 'preference'
  createdAt: Date
}

export interface PythonChatPayload {
  message: string
  userId: string
  goals: object[]
  chat_history: ChatMessage[]
  memory: AgentMemory[]
}