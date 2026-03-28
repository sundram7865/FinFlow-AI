import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { CATEGORIES } from '@/types/transaction.types'

interface Props { open: boolean; onClose: () => void }

export default function AddTransactionModal({ open, onClose }: Props) {
  const { mutate, isPending } = useCreateTransaction()
  const [form, setForm] = useState({ amount: '', type: 'DEBIT', category: 'food', description: '', date: new Date().toISOString().split('T')[0] })

  const handleSubmit = () => {
    mutate({ ...form, amount: parseFloat(form.amount), date: `${form.date}T00:00:00Z` } as any, {
      onSuccess: () => { onClose(); setForm({ amount: '', type: 'DEBIT', category: 'food', description: '', date: new Date().toISOString().split('T')[0] }) }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <Input placeholder="Amount (₹)" type="number" value={form.amount} onChange={e => setForm(s => ({ ...s, amount: e.target.value }))} />
          <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.type} onChange={e => setForm(s => ({ ...s, type: e.target.value }))}>
            <option value="DEBIT">Expense</option>
            <option value="CREDIT">Income</option>
          </select>
          <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.category} onChange={e => setForm(s => ({ ...s, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Input placeholder="Description (optional)" value={form.description} onChange={e => setForm(s => ({ ...s, description: e.target.value }))} />
          <Input type="date" value={form.date} onChange={e => setForm(s => ({ ...s, date: e.target.value }))} />
          <Button className="w-full" onClick={handleSubmit} disabled={!form.amount || isPending}>
            {isPending ? 'Adding...' : 'Add Transaction'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}