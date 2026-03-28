import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL as string

const redis = new Redis(redisUrl, {
  lazyConnect:    false,   // connect immediately
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('❌ Redis connection failed after 3 retries')
      return null
    }
    return Math.min(times * 200, 1000)
  },
})

redis.on('connect', () => console.log('✅ Redis connected'))
redis.on('error',   (err) => console.error('❌ Redis error:', err.message))

export default redis