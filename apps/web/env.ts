import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  shared: {
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
  },
  server: {
    SESSION_COOKIE_NAME: z.string(),
    BACKEND_URL: z.string().url().default('http://localhost:4000'),
    IS_DOCKER: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .default('false'),
  },
  runtimeEnv: {
    SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
    BACKEND_URL: process.env.BACKEND_URL,
    NODE_ENV: process.env.NODE_ENV,
    IS_DOCKER: process.env.IS_DOCKER,
  },
})
