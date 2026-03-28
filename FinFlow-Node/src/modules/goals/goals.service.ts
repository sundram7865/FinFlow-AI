import prisma from '../../config/db.postgres'
import { AppError } from '../../middleware/error.middleware'
import { CreateGoalInput, UpdateGoalInput } from './goals.validator'

// ─── CREATE GOAL + AUTO GENERATE MILESTONES ───────────────────────────────────

export const createGoal = async (userId: string, input: CreateGoalInput) => {
  const deadline = new Date(input.deadline)
  const now      = new Date()

  // Calculate number of weeks until deadline
  const msPerWeek  = 7 * 24 * 60 * 60 * 1000
  const totalWeeks = Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / msPerWeek))
  const weeklyTarget = input.targetAmount / totalWeeks

  const goal = await prisma.goal.create({
    data: {
      userId,
      title:        input.title,
      description:  input.description,
      targetAmount: input.targetAmount,
      deadline,
      milestones: {
        create: Array.from({ length: totalWeeks }, (_, i) => {
          const dueDate = new Date(now.getTime() + (i + 1) * msPerWeek)
          return {
            weekNumber: i + 1,
            targetSave: weeklyTarget,
            dueDate,
          }
        }),
      },
    },
    include: { milestones: true },
  })

  return goal
}

// ─── LIST GOALS ───────────────────────────────────────────────────────────────

export const listGoals = async (userId: string) => {
  return prisma.goal.findMany({
    where:   { userId },
    include: { milestones: { orderBy: { weekNumber: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
}

// ─── GET ONE ──────────────────────────────────────────────────────────────────

export const getGoal = async (userId: string, id: string) => {
  const goal = await prisma.goal.findUnique({
    where:   { id },
    include: { milestones: { orderBy: { weekNumber: 'asc' } } },
  })
  if (!goal)              throw new AppError('Goal not found', 404)
  if (goal.userId !== userId) throw new AppError('Forbidden', 403)
  return goal
}

// ─── UPDATE GOAL ──────────────────────────────────────────────────────────────

export const updateGoal = async (userId: string, id: string, input: UpdateGoalInput) => {
  await getGoal(userId, id)

  return prisma.goal.update({
    where: { id },
    data: {
      ...(input.title        !== undefined && { title:        input.title }),
      ...(input.description  !== undefined && { description:  input.description }),
      ...(input.targetAmount !== undefined && { targetAmount: input.targetAmount }),
      ...(input.savedAmount  !== undefined && { savedAmount:  input.savedAmount }),
      ...(input.deadline     !== undefined && { deadline:     new Date(input.deadline) }),
    },
    include: { milestones: true },
  })
}

// ─── DELETE GOAL ──────────────────────────────────────────────────────────────

export const deleteGoal = async (userId: string, id: string): Promise<void> => {
  await getGoal(userId, id)
  await prisma.goal.delete({ where: { id } })
}

// ─── GET GOAL PROGRESS ────────────────────────────────────────────────────────

export const getGoalProgress = async (userId: string, id: string) => {
  const goal = await getGoal(userId, id)

  const progressPct   = (goal.savedAmount / goal.targetAmount) * 100
  const remaining     = goal.targetAmount - goal.savedAmount
  const daysLeft      = Math.ceil((goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const totalMilestones    = goal.milestones.length
  const achievedMilestones = goal.milestones.filter(m => m.achieved).length

  return {
    goal,
    progressPct:      Math.min(progressPct, 100),
    remaining,
    daysLeft,
    milestonesTotal:  totalMilestones,
    milestonesHit:    achievedMilestones,
    onTrack:          progressPct >= (achievedMilestones / totalMilestones) * 100,
  }
}

// ─── MARK MILESTONE ACHIEVED (called by cron job) ────────────────────────────

export const checkAndUpdateMilestones = async (userId: string): Promise<void> => {
  const goals = await prisma.goal.findMany({
    where:   { userId, status: 'ACTIVE' },
    include: { milestones: true },
  })

  for (const goal of goals) {
    // Check if goal is fully achieved
    if (goal.savedAmount >= goal.targetAmount) {
      await prisma.goal.update({ where: { id: goal.id }, data: { status: 'COMPLETED' } })
      continue
    }

    // Check deadline passed
    if (goal.deadline < new Date()) {
      await prisma.goal.update({ where: { id: goal.id }, data: { status: 'FAILED' } })
      continue
    }

    // Mark overdue milestones
    for (const milestone of goal.milestones) {
      if (!milestone.achieved && milestone.dueDate < new Date()) {
        await prisma.milestone.update({
          where: { id: milestone.id },
          data:  { achieved: goal.savedAmount >= milestone.targetSave * milestone.weekNumber },
        })
      }
    }
  }
}