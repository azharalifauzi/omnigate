import { zValidator } from '@hono/zod-validator'
import { count, desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '~/lib/db'
import { ServerError } from '~/lib/error'
import { generateJsonResponse } from '~/lib/response'
import { authMiddleware } from '~/middlewares/auth'
import { featureFlags } from '~/schemas'

const app = new Hono()
  .get(
    '/',
    zValidator(
      'query',
      z.object({
        page: z.number({ coerce: true }).optional(),
        size: z.number({ coerce: true }).optional(),
      }),
    ),
    authMiddleware({ permission: 'read:feature-flags' }),
    async (c) => {
      const { page = 1, size = 10 } = c.req.valid('query')
      const skip = (page - 1) * size

      const totalCount = await db
        .select({
          count: count(),
        })
        .from(featureFlags)

      const pageCount = Math.ceil(totalCount[0]!.count / size)

      const data = await db
        .select()
        .from(featureFlags)
        .limit(size)
        .offset(skip)
        .orderBy(desc(featureFlags.createdAt))

      return generateJsonResponse(c, {
        data,
        pageCount,
        totalCount: totalCount[0]!.count,
      })
    },
  )
  .get(
    '/:id',
    authMiddleware({ permission: 'read:feature-flags' }),
    async (c) => {
      const id = Number(c.req.param('id'))

      const featureFlag = await db.query.featureFlags.findFirst({
        where: eq(featureFlags.id, id),
      })

      if (!featureFlag) {
        throw new ServerError({
          statusCode: 404,
          message: 'Failed get feature flag',
          description: 'Feature flag is not found',
        })
      }

      return generateJsonResponse(c, featureFlag)
    },
  )
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        name: z.string(),
        key: z.string(),
        description: z.string(),
        allowOverride: z.enum(['user', 'organization']).optional(),
        defaultValue: z.boolean(),
      }),
    ),
    authMiddleware({ permission: 'write:feature-flags' }),
    async (c) => {
      const body = c.req.valid('json')

      const existingFeatureFlag = await db.query.featureFlags.findFirst({
        where: eq(featureFlags.key, body.key),
      })

      if (existingFeatureFlag) {
        throw new ServerError({
          statusCode: 404,
          message: 'Failed create feature flag',
          description: `Feature flag with ${body.key} key is already exist`,
        })
      }

      const featureFlag = await db.insert(featureFlags).values(body).returning()

      return generateJsonResponse(c, featureFlag[0], 201)
    },
  )
  .put(
    '/:id',
    zValidator(
      'json',
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        defaultValue: z.boolean().optional(),
      }),
    ),
    authMiddleware({ permission: 'write:feature-flags' }),
    async (c) => {
      const body = c.req.valid('json')
      const id = Number(c.req.param('id'))

      const featureFlag = await db
        .update(featureFlags)
        .set(body)
        .where(eq(featureFlags.id, id))
        .returning()

      return generateJsonResponse(c, featureFlag[0])
    },
  )
  .delete(
    '/:id',
    authMiddleware({ permission: 'write:feature-flags' }),
    async (c) => {
      const id = Number(c.req.param('id'))

      await db.delete(featureFlags).where(eq(featureFlags.id, id))

      return generateJsonResponse(c)
    },
  )

export default app
