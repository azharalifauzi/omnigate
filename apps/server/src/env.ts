import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  shared: {
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
  },
  server: {
    DATABASE_URL: z.string(),
    DEFAULT_ORG_ID: z.number({ coerce: true }).default(1),
    SESSION_COOKIE_NAME: z.string().default('session'),
    PORT: z.number({ coerce: true }).default(4000),
    SMTP_PASSWORD: z.string(),
    SMTP_USERNAME: z.string(),
    SMTP_HOST: z.string(),
    SMTP_PORT: z.number({ coerce: true }),
    EMAIL_SENDER: z.string(),
    EMAIL_CATCHER: z.string().email().optional(),
    S3_BUCKET_NAME: z.string(),
    S3_SPACES_ENDPOINT: z.string(),
    S3_SPACES_SECRET_KEY: z.string(),
    S3_SPACES_ACCESS_KEY_ID: z.string(),
    IS_DOCKER: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .default('false'),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL!,
    DEFAULT_ORG_ID: process.env.DEFAULT_ORG_ID!,
    SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME!,
    PORT: process.env.PORT!,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD!,
    SMTP_USERNAME: process.env.SMTP_USERNAME!,
    SMTP_HOST: process.env.SMTP_HOST!,
    SMTP_PORT: process.env.SMTP_PORT!,
    EMAIL_SENDER: process.env.EMAIL_SENDER!,
    EMAIL_CATCHER: process.env.EMAIL_CATCHER!,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME!,
    S3_SPACES_ENDPOINT: process.env.S3_SPACES_ENDPOINT!,
    S3_SPACES_SECRET_KEY: process.env.S3_SPACES_SECRET_KEY!,
    S3_SPACES_ACCESS_KEY_ID: process.env.S3_SPACES_ACCESS_KEY_ID!,
    NODE_ENV: process.env.NODE_ENV,
    IS_DOCKER: process.env.IS_DOCKER,
  },
})
