export type AgentType = 'analyst' | 'advisor' | 'planner' | 'general'

export interface IChat {
  chatId:    string
  userId:    string
  title:     string
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  messageId:  string
  chatId:     string
  role:       'user' | 'assistant'
  content:    string
  agentUsed?: AgentType
  timestamp:  string
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