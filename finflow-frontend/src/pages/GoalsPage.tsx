import { useState } from 'react'
import { Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PageHeader      from '@/components/shared/PageHeader'
import GoalCard        from '@/components/goals/GoalCard'
import CreateGoalModal from '@/components/goals/CreateGoalModal'
import EmptyState      from '@/components/shared/EmptyState'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { useGoals }    from '@/hooks/useGoals'

export default function GoalsPage() {
  const [showModal, setShowModal] = useState(false)
  const { data: goals = [], isLoading } = useGoals()

  return (
    <div>
      <PageHeader
        title="Goals"
        description="Track your financial goals and milestones"
        action={<Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4 mr-2" />New Goal</Button>}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Create your first savings goal and track your progress week by week."
          action={<Button onClick={() => setShowModal(true)}>Create goal</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => <GoalCard key={goal.id} goal={goal} />)}
        </div>
      )}

      <CreateGoalModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}