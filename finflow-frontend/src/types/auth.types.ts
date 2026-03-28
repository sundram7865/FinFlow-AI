export interface User {
  id:        string
  email:     string
  name:      string | null
  role:      'USER' | 'ADMIN'
  createdAt: string
  _count?: {
    transactions: number
    goals:        number
    reports:      number
  }
}

export interface LoginInput {
  email:    string
  password: string
}

export interface RegisterInput {
  email:    string
  password: string
  name?:    string
}

export interface AuthTokens {
  accessToken:  string
  refreshToken: string
}

export interface LoginResponse {
  user:         User
  accessToken:  string
  refreshToken: string
}