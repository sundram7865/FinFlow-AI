import cron from 'node-cron'
import prisma from '../config/db.postgres'
import { checkAndUpdateMilestones } from '../modules/goals/goals.service'
import { triggerReportGeneration } from '../modules/reports/reports.routes'

export const startCronJobs = (): void => {

  // Every Monday at 9am — check goal milestones for all active users
  cron.schedule('0 9 * * 1', async () => {
    console.log('⏰ Running weekly goal milestone check...')
    try {
      const activeUsers = await prisma.user.findMany({
        where: { goals: { some: { status: 'ACTIVE' } } },
        select: { id: true },
      })

      await Promise.allSettled(
        activeUsers.map(u => checkAndUpdateMilestones(u.id))
      )
      console.log(`✅ Milestone check done for ${activeUsers.length} users`)
    } catch (err) {
      console.error('❌ Milestone cron failed:', err)
    }
  })

  // 1st of every month at 8am — auto generate monthly reports
  cron.schedule('0 8 1 * *', async () => {
    console.log('⏰ Running monthly report generation...')
    try {
      const now   = new Date()
      const month = now.getMonth() === 0 ? 12 : now.getMonth()
      const year  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()

      const users = await prisma.user.findMany({ select: { id: true } })

      await Promise.allSettled(
        users.map(u => triggerReportGeneration(u.id, month, year).catch(e =>
          console.warn(`Report skipped for ${u.id}:`, e.message)
        ))
      )
      console.log('✅ Monthly reports done')
    } catch (err) {
      console.error('❌ Report cron failed:', err)
    }
  })

  console.log('✅ Cron jobs started')
}