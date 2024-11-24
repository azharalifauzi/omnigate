import { db } from '~/lib/db'
import { authMiddleware } from '~/middlewares/auth'
import { organizations, users, usersToOrganizations } from '~/schemas'
import { zValidator } from '@hono/zod-validator'
import { count, desc, eq, getTableColumns } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
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
      permission: 'read:organizations',
    }),
    async (c) => {
      const { page = 1, size = 10 } = c.req.valid('query')
      const skip = (page - 1) * size

      const totalCount = await db
        .select({
          count: count(),
        })
        .from(organizations)
      const pageCount = Math.ceil(totalCount[0]!.count / size)

      const data = await db
        .select({
          ...getTableColumns(organizations),
          usersCount: count(users.id),
        })
        .from(organizations)
        .leftJoin(
          usersToOrganizations,
          eq(organizations.id, usersToOrganizations.organizationId),
        )
        .leftJoin(users, eq(usersToOrganizations.userId, users.id))
        .groupBy(organizations.id)
        .limit(size)
        .offset(skip)
        .orderBy(desc(organizations.createdAt))

      return generateJsonResponse(c, {
        pageCount,
        data,
        totalCount: totalCount[0]!.count,
      })
    },
  )
  .get(
    '/:id',
    authMiddleware({ permission: 'read:organizations' }),
    async (c) => {
      const id = c.req.param('id')
      const organization = await db.query.organizations.findFirst({
        where: (org, { eq }) => eq(org.id, Number(id)),
      })

      return generateJsonResponse(c, organization)
    },
  )
  .get(
    '/:id/users',
    zValidator(
      'query',
      z.object({
        page: z.number({ coerce: true }).positive().optional(),
        size: z.number({ coerce: true }).optional(),
      }),
    ),
    authMiddleware({ permission: 'read:organizations' }),
    async (c) => {
      const id = c.req.param('id')
      const { page = 1, size = 10 } = c.req.valid('query')
      const skip = (page - 1) * size

      const columns = getTableColumns(users)

      const data = await db
        .select(columns)
        .from(users)
        .leftJoin(
          usersToOrganizations,
          eq(users.id, usersToOrganizations.userId),
        )
        .leftJoin(
          organizations,
          eq(usersToOrganizations.organizationId, organizations.id),
        )
        .where(eq(organizations.id, Number(id)))
        .limit(size)
        .offset(skip)

      const totalCount = await db
        .select({
          count: count(),
        })
        .from(usersToOrganizations)
        .where(eq(usersToOrganizations.organizationId, Number(id)))
      const pageCount = Math.ceil(totalCount[0]!.count / size)

      return generateJsonResponse(c, {
        pageCount,
        data,
        totalCount: totalCount[0]!.count,
      })
    },
  )
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        name: z.string(),
      }),
    ),
    authMiddleware({
      permission: 'write:organizations',
    }),
    async (c) => {
      const data = c.req.valid('json')
      const permission = await db.insert(organizations).values(data).returning()

      return generateJsonResponse(c, permission, 201)
    },
  )
  .put(
    '/:id',
    zValidator(
      'json',
      z.object({
        name: z.string().optional(),
      }),
    ),
    authMiddleware({
      permission: 'write:organizations',
    }),
    async (c) => {
      const id = c.req.param('id')
      const data = c.req.valid('json')
      const role = await db
        .update(organizations)
        .set(data)
        .where(eq(organizations.id, Number(id)))
        .returning()

      return generateJsonResponse(c, role[0])
    },
  )
  .delete(
    '/:id',
    authMiddleware({
      permission: 'write:organizations',
    }),
    async (c) => {
      const id = c.req.param('id')
      await db.delete(organizations).where(eq(organizations.id, Number(id)))

      return generateJsonResponse(c)
    },
  )

export default app
