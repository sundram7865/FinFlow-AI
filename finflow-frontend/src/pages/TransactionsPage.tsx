import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PageHeader            from '@/components/shared/PageHeader'
import TransactionFilters    from '@/components/transactions/TransactionFilters'
import TransactionTable      from '@/components/transactions/TransactionTable'
import TransactionSummaryBar from '@/components/transactions/TransactionSummary'
import AddTransactionModal   from '@/components/transactions/AddTransactionModal'
import { TableSkeleton }     from '@/components/shared/LoadingSkeleton'
import EmptyState            from '@/components/shared/EmptyState'
import { useTransactions, useTransactionSummary } from '@/hooks/useTransactions'
import type { TransactionFilters as IFilters } from '@/types/transaction.types'
import { ArrowLeftRight } from 'lucide-react'

export default function TransactionsPage() {
  const [filters, setFilters] = useState<IFilters>({ page: 1, limit: 20 })
  const [showModal, setShowModal] = useState(false)
  const { data, isLoading } = useTransactions(filters)
  const now  = new Date()
  const { data: summary } = useTransactionSummary(now.getMonth() + 1, now.getFullYear())

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="All your income and expenses"
        action={<Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4 mr-2" />Add</Button>}
      />

      {summary && <TransactionSummaryBar summary={summary} />}
      <TransactionFilters filters={filters} onChange={f => setFilters({ ...f, page: 1, limit: 20 })} />

      {isLoading ? <TableSkeleton /> : data?.data.length === 0
        ? <EmptyState icon={ArrowLeftRight} title="No transactions" description="Add your first transaction or upload a bank statement." />
        : <TransactionTable transactions={data?.data ?? []} />
      }

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={filters.page === 1} onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}>Previous</Button>
          <span className="text-sm flex items-center px-3">Page {filters.page} of {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={filters.page === data.totalPages} onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}>Next</Button>
        </div>
      )}

      <AddTransactionModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}