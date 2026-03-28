import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateGoal } from '@/hooks/useGoals'

interface Props { open: boolean; onClose: () => void }

export default function CreateGoalModal({ open, onClose }: Props) {
  const { mutate, isPending } = useCreateGoal()
  const [form, setForm] = useState({ title: '', targetAmount: '', deadline: '', description: '' })

  const handleSubmit = () => {
    mutate({
      title: form.title,
      targetAmount: parseFloat(form.targetAmount),
      deadline: `${form.deadline}T23:59:59Z`,
      description: form.description || undefined,
    }, { onSuccess: onClose })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Goal</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <Input placeholder="Goal title (e.g. Save ₹50,000)" value={form.title} onChange={e => setForm(s => ({ ...s, title: e.target.value }))} />
          <Input placeholder="Target amount (₹)" type="number" value={form.targetAmount} onChange={e => setForm(s => ({ ...s, targetAmount: e.target.value }))} />
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Deadline</label>
            <Input type="date" value={form.deadline} onChange={e => setForm(s => ({ ...s, deadline: e.target.value }))} />
          </div>
          <Input placeholder="Description (optional)" value={form.description} onChange={e => setForm(s => ({ ...s, description: e.target.value }))} />
          <Button className="w-full" onClick={handleSubmit} disabled={!form.title || !form.targetAmount || !form.deadline || isPending}>
            {isPending ? 'Creating...' : 'Create Goal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}