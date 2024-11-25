import { serve } from '@hono/node-server'
import app, { ApiRoutesType } from './app'
import { env } from './env'

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  () => {
    console.log(`Server is running on http://localhost:${env.PORT}`)
  },
)

export { type User } from './services/users'
export { type ApiRoutesType }
