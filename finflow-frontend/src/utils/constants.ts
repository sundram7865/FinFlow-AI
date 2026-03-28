export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const CATEGORY_COLORS: Record<string, string> = {
  salary:        '#1D9E75',
  food:          '#E24B4A',
  transport:     '#378ADD',
  rent:          '#534AB7',
  shopping:      '#EF9F27',
  entertainment: '#D4537E',
  healthcare:    '#5DCAA5',
  utilities:     '#888780',
  transfer:      '#97C459',
  other:         '#B4B2A9',
}

export const SEVERITY_COLORS = {
  low:    'text-yellow-600 bg-yellow-50 border-yellow-200',
  medium: 'text-orange-600 bg-orange-50 border-orange-200',
  high:   'text-red-600 bg-red-50 border-red-200',
}

export const AGENT_LABELS: Record<string, string> = {
  analyst: 'Analyst',
  advisor: 'Advisor',
  planner: 'Planner',
  general: 'FinFlow AI',
}

export const AGENT_COLORS: Record<string, string> = {
  analyst: 'bg-blue-100 text-blue-700',
  advisor: 'bg-green-100 text-green-700',
  planner: 'bg-purple-100 text-purple-700',
  general: 'bg-gray-100 text-gray-700',
}