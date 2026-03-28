export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('en-IN', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  }).format(new Date(date))
}

export const formatShortDate = (date: string): string => {
  return new Intl.DateTimeFormat('en-IN', {
    day:   '2-digit',
    month: 'short',
  }).format(new Date(date))
}

export const formatMonthYear = (month: number, year: number): string => {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year:  'numeric',
  }).format(new Date(year, month - 1))
}

export const formatPercent = (value: number): string => {
  return `${Math.round(value)}%`
}

export const formatNumber = (value: number): string => {
  if (value >= 100000)  return `₹${(value / 100000).toFixed(1)}L`
  if (value >= 1000)    return `₹${(value / 1000).toFixed(1)}K`
  return `₹${value}`
}

export const getMonthName = (month: number): string => {
  return new Intl.DateTimeFormat('en-IN', { month: 'long' })
    .format(new Date(2024, month - 1))
}