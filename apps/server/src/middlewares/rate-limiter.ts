import { createMiddleware } from 'hono/factory'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { ServerError } from '../lib/error'

const _rateLimiter = new RateLimiterMemory({
  points: 50,
  duration: 1,
})

export const rateLimiter = () =>
  createMiddleware(async (c, next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip')

    if (!ip || ip === 'internal') {
      console.log('rate limiter: here internal')
      return await next()
    }

    try {
      await _rateLimiter.consume(ip)
      await next()
    } catch (error) {
      throw new ServerError({
        statusCode: 429,
        message: 'Too many requests',
      })
    }
  })
