import 'dotenv/config'
import app from './app'
import connectMongo from './config/db.mongo'
import prisma       from './config/db.postgres'
import redis        from './config/redis'
import { startCronJobs } from './utils/cron'

const PORT = parseInt(process.env.PORT ?? '3000', 10)

const start = async (): Promise<void> => {
  try {
    // Connect all databases
    await prisma.$connect()
    console.log('✅ PostgreSQL connected')

    await connectMongo()

    await redis.connect()

    // Start background jobs
    startCronJobs()

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 FinFlow Node.js API running on http://localhost:${PORT}`)
      console.log(`📋 Environment: ${process.env.NODE_ENV}`)
    })
  } catch (err) {
    console.error('❌ Failed to start server:', err)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...')
  await prisma.$disconnect()
  await redis.quit()
  process.exit(0)
})

start()