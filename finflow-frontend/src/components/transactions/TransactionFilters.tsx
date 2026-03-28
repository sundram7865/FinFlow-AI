import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import  { type TransactionFilters as IFilters, CATEGORIES } from '@/types/transaction.types'

interface Props { filters: IFilters; onChange: (f: IFilters) => void }

export default function TransactionFilters({ filters, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <select
        className="h-10 rounded-md border bg-background px-3 text-sm"
        value={filters.type ?? ''}
        onChange={e => onChange({ ...filters, type: (e.target.value as any) || undefined })}
      >
        <option value="">All types</option>
        <option value="CREDIT">Income</option>
        <option value="DEBIT">Expense</option>
      </select>
      <select
        className="h-10 rounded-md border bg-background px-3 text-sm"
        value={filters.category ?? ''}
        onChange={e => onChange({ ...filters, category: e.target.value || undefined })}
      >
        <option value="">All categories</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <Input
        type="date"
        className="w-40"
        value={filters.startDate?.split('T')[0] ?? ''}
        onChange={e => onChange({ ...filters, startDate: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })}
      />
      <Input
        type="date"
        className="w-40"
        value={filters.endDate?.split('T')[0] ?? ''}
        onChange={e => onChange({ ...filters, endDate: e.target.value ? `${e.target.value}T23:59:59Z` : undefined })}
      />
      <Button variant="outline" size="sm" onClick={() => onChange({})}>Reset</Button>
    </div>
  )
}