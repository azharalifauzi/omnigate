import { Hono } from 'hono'
import { compress } from 'hono/compress'
import user from './routes/user'
import role from './routes/role'
import permission from './routes/permission'
import organization from './routes/organization'
import file from './routes/file'
import auth from './routes/auth'
import featureFlag from './routes/feature-flag'
import { logger } from './middlewares/logger'
import { ServerError } from './lib/error'
import { secureHeaders } from 'hono/secure-headers'
import { csrf } from 'hono/csrf'
import { rateLimiter } from './middlewares/rate-limiter'
import { env } from './env'

const isProduction = env.NODE_ENV === 'production'

const app = new Hono()
// NOTE: Compress doesn't work with Bun for now
app.use(compress())
app.use(logger())
if (isProduction) {
  app.use(csrf())
}
app.use('*', secureHeaders())
app.use('*', rateLimiter())

const apiRoutes = app
  .basePath('/api/v1/')
  .route('/user', user)
  .route('/role', role)
  .route('/permission', permission)
  .route('/organization', organization)
  .route('/file', file)
  .route('/auth', auth)
  .route('/feature-flag', featureFlag)

app.get('/api/v1/healthcheck', (c) => c.json({ message: 'OK' }))

app.onError(async (err, c) => {
  if (err instanceof ServerError) {
    const error = err as InstanceType<typeof ServerError>
    return c.json(error.response, error.response.statusCode)
  }

  console.error(err)

  if (err instanceof Error) {
    const error: Error = err
    return c.json(
      {
        statusCode: 500,
        message: 'Internal Server Error',
        description: error.message,
        data: isProduction
          ? null
          : {
              cause: error.cause,
              stack: error.stack,
            },
      },
      500,
    )
  }

  return c.json(
    {
      statusCode: 500,
      message: 'Internal Server Error',
      data: isProduction ? null : err,
    },
    500,
  )
})

app.notFound(async (c) => {
  return c.json({
    message: "Endpoint you're looking for is not found",
    data: null,
  })
})

export type ApiRoutesType = typeof apiRoutes
export default app as ApiRoutesType
