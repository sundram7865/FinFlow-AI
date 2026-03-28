export type AgentType = 'analyst' | 'advisor' | 'planner' | 'general'

export interface ChatMessage {
  id:        string
  role:      'user' | 'assistant'
  content:   string
  agentUsed?: AgentType
  timestamp: string
}

export interface Anomaly {
  _id?:        string
  userId:      string
  description: string
  severity:    'low' | 'medium' | 'high'
  detectedAt:  string
  seen:        boolean
}

export interface AgentMemory {
  summary:   string
  type:      'pattern' | 'preference'
  createdAt: string
}