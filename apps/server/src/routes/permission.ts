import { db } from '~/lib/db'
import { authMiddleware } from '~/middlewares/auth'
import { permissions } from '~/schemas'
import { zValidator } from '@hono/zod-validator'
import { eq, count } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { ServerError } from '../lib/error'
import { generateJsonResponse } from '../lib/response'

const app = new Hono()
  .get(
    '/',
    zValidator(
      'query',
      z.object({
        page: z.number({ coerce: true }).positive().optional(),
        size: z.number({ coerce: true }).optional(),
      }),
    ),
    authMiddleware({
      permission: 'read:permissions',
    }),
    async (c) => {
      const { page = 1, size = 10 } = c.req.valid('query')
      const skip = (page - 1) * size

      const totalCount = await db
        .select({
          count: count(),
        })
        .from(permissions)

      const pageCount = Math.ceil(totalCount[0]!.count / size)

      const data = await db.query.permissions.findMany({
        limit: size,
        offset: skip,
        orderBy: (permissions, { desc }) => [desc(permissions.createdAt)],
      })

      return generateJsonResponse(c, {
        data,
        pageCount,
        totalCount: totalCount[0]!.count,
      })
    },
  )
  .get(
    '/:id',
    authMiddleware({ permission: 'read:permissions' }),
    async (c) => {
      const id = c.req.param('id')
      const permission = await db.query.permissions.findFirst({
        where: (permission, { eq }) => eq(permission.id, Number(id)),
      })

      return generateJsonResponse(c, permission)
    },
  )
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        name: z.string(),
        key: z.string(),
        description: z.string().optional(),
      }),
    ),
    authMiddleware({
      permission: 'write:permissions',
    }),
    async (c) => {
      const data = c.req.valid('json')

      try {
        const permission = await db.insert(permissions).values(data).returning()

        return generateJsonResponse(c, permission, 201)
      } catch (err) {
        const error = err as any
        if (error.constraint === 'permissions_key_unique') {
          throw new ServerError({
            statusCode: 400,
            message: 'Something wrong when creating permission',
            description: error.detail,
          })
        }

        throw error
      }
    },
  )
  .put(
    '/:id',
    zValidator(
      'json',
      z.object({
        name: z.string().optional(),
        key: z.string().optional(),
        description: z.string().optional(),
      }),
    ),
    authMiddleware({
      permission: 'write:permissions',
    }),
    async (c) => {
      const id = c.req.param('id')
      const data = c.req.valid('json')

      try {
        const role = await db
          .update(permissions)
          .set(data)
          .where(eq(permissions.id, Number(id)))
          .returning()

        return generateJsonResponse(c, role[0])
      } catch (err) {
        const error = err as any

        if (error.constraint === 'permissions_key_unique') {
          throw new ServerError({
            statusCode: 400,
            message: 'Something wrong when editing permission',
            description: error.detail,
          })
        }

        throw error
      }
    },
  )
  .delete(
    '/:id',
    authMiddleware({
      permission: 'write:permissions',
    }),
    async (c) => {
      const id = c.req.param('id')
      await db.delete(permissions).where(eq(permissions.id, Number(id)))

      return generateJsonResponse(c)
    },
  )

export default app
