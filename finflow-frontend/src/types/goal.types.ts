export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED'

export interface Milestone {
  id:         string
  goalId:     string
  weekNumber: number
  targetSave: number
  achieved:   boolean
  dueDate:    string
  createdAt:  string
}

export interface Goal {
  id:           string
  userId:       string
  title:        string
  description:  string | null
  targetAmount: number
  savedAmount:  number
  deadline:     string
  status:       GoalStatus
  createdAt:    string
  milestones:   Milestone[]
}

export interface GoalProgress {
  goal:             Goal
  progressPct:      number
  remaining:        number
  daysLeft:         number
  milestonesTotal:  number
  milestonesHit:    number
  onTrack:          boolean
}

export interface CreateGoalInput {
  title:        string
  description?: string
  targetAmount: number
  deadline:     string
}