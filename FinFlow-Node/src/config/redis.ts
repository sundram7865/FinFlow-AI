import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL as string, {
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('❌ Redis connection failed after 3 retries')
      return null
    }
    return Math.min(times * 200, 1000)
  },
})

redis.on('connect', () => console.log('✅ Redis connected'))
redis.on('error', (err) => console.error('❌ Redis error:', err))

export default redis