import { zValidator } from '@hono/zod-validator'
import { and, count, desc, eq, getTableColumns, ilike } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { env } from '~/env'
import { db } from '~/lib/db'
import { authMiddleware } from '~/middlewares/auth'
import {
  organizations,
  roles,
  rolesToUsers,
  sessions,
  users,
  usersToOrganizations,
} from '~/schemas'
import { getUserById, updateUserById } from '~/services/users'
import { isEmail } from '~/utils'
import { ServerError } from '../lib/error'
import { generateJsonResponse } from '../lib/response'
import { jsonAggBuildObjectOrEmptyArray } from '../utils/drizzle'

const app = new Hono()
  .get('/me', authMiddleware(), async (c) => {
    const userId = c.get('userId')

    const user = await getUserById(userId)

    if (!user) {
      throw new ServerError({
        statusCode: 404,
        message: 'User not found',
      })
    }

    return generateJsonResponse(c, user)
  })
  .get(
    '/',
    zValidator(
      'query',
      z.object({
        page: z.number({ coerce: true }).positive().optional(),
        size: z.number({ coerce: true }).optional(),
        search: z.string().optional(),
        organizationId: z.number({ coerce: true }).optional(),
      }),
    ),
    authMiddleware({
      permission: 'read:users',
    }),
    async (c) => {
      const {
        page = 1,
        size = 10,
        search,
        organizationId = env.DEFAULT_ORG_ID,
      } = c.req.valid('query')
      const skip = (page - 1) * size

      const totalCount = await db
        .select({
          count: count(),
        })
        .from(users)
      const pageCount = Math.ceil(totalCount[0]!.count / size)

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
        .where(
          and(
            search && isEmail(search)
              ? ilike(users.email, search)
              : search
                ? ilike(users.name, `%${search}%`)
                : undefined,
            eq(usersToOrganizations.organizationId, organizationId),
          ),
        )
        .limit(size)
        .offset(skip)
        .orderBy(desc(users.createdAt))

      return generateJsonResponse(c, {
        data,
        pageCount,
        totalCount: totalCount[0]!.count,
      })
    },
  )
  .get(
    '/:id',
    authMiddleware({
      permission: 'read:users',
    }),
    async (c) => {
      const user = await getUserById(Number(c.req.param('id')))

      if (!user) {
        throw new ServerError({
          statusCode: 404,
          message: 'User not found',
        })
      }

      return generateJsonResponse(c, user)
    },
  )
  .get(
    '/:id/roles',
    authMiddleware({
      permission: 'read:users',
    }),
    async (c) => {
      const userId = Number(c.req.param('id'))

      const data = await db
        .select({
          orgId: organizations.id,
          orgName: organizations.name,
          roles: jsonAggBuildObjectOrEmptyArray(roles, {
            ...getTableColumns(roles),
          }),
        })
        .from(organizations)
        .leftJoin(
          rolesToUsers,
          eq(organizations.id, rolesToUsers.organizationId),
        )
        .leftJoin(roles, eq(rolesToUsers.roleId, roles.id))
        .where(eq(rolesToUsers.userId, userId))
        .groupBy(organizations.id)

      return generateJsonResponse(c, data)
    },
  )
  .post(
    '/:id/assign-role',
    authMiddleware({
      permission: 'write:users',
    }),
    zValidator(
      'json',
      z.object({
        roleId: z.number({ coerce: true }),
        organizationId: z.number({ coerce: true }),
      }),
    ),
    async (c) => {
      const id = c.req.param('id')
      const { roleId, organizationId } = c.req.valid('json')

      await db.insert(rolesToUsers).values({
        organizationId,
        roleId,
        userId: Number(id),
      })

      return generateJsonResponse(c)
    },
  )
  .post(
    '/:id/unassign-role',
    authMiddleware({
      permission: 'write:users',
    }),
    zValidator(
      'json',
      z.object({
        roleId: z.number({ coerce: true }),
        organizationId: z.number({ coerce: true }),
      }),
    ),
    async (c) => {
      const id = c.req.param('id')
      const { roleId, organizationId } = c.req.valid('json')

      await db
        .delete(rolesToUsers)
        .where(
          and(
            eq(rolesToUsers.organizationId, organizationId),
            eq(rolesToUsers.userId, Number(id)),
            eq(rolesToUsers.roleId, roleId),
          ),
        )

      return generateJsonResponse(c)
    },
  )
  .post(
    '/:id/assign-organization',
    authMiddleware({
      permission: 'write:users',
    }),
    zValidator(
      'json',
      z.object({
        organizationId: z.number({ coerce: true }),
      }),
    ),
    async (c) => {
      const id = c.req.param('id')
      const { organizationId } = c.req.valid('json')

      await db.insert(usersToOrganizations).values({
        organizationId,
        userId: Number(id),
      })

      return generateJsonResponse(c)
    },
  )
  .post(
    '/:id/unassign-organization',
    authMiddleware({
      permission: 'write:users',
    }),
    zValidator(
      'json',
      z.object({
        organizationId: z.number({ coerce: true }),
      }),
    ),
    async (c) => {
      const id = c.req.param('id')
      const { organizationId } = c.req.valid('json')

      await db
        .delete(usersToOrganizations)
        .where(
          and(
            eq(usersToOrganizations.organizationId, organizationId),
            eq(usersToOrganizations.userId, Number(id)),
          ),
        )

      return generateJsonResponse(c)
    },
  )
  .post(
    '/',
    authMiddleware({
      permission: 'write:users',
    }),
    zValidator(
      'json',
      z.object({
        email: z.string().email(),
        name: z.string(),
      }),
    ),
    async (c) => {
      const data = c.req.valid('json')
      const user = await db.insert(users).values(data).returning()

      await db.insert(usersToOrganizations).values({
        organizationId: env.DEFAULT_ORG_ID,
        userId: user[0]!.id,
      })

      return generateJsonResponse(c, user, 201)
    },
  )
  .put(
    '/me',
    authMiddleware(),
    zValidator(
      'json',
      z.object({
        name: z.string().optional(),
        image: z.string().optional().nullable(),
      }),
    ),
    async (c) => {
      const id = c.get('userId')
      const data = c.req.valid('json')

      const user = await updateUserById(id, data)

      return generateJsonResponse(c, user)
    },
  )
  .put(
    '/:id',
    authMiddleware({
      permission: 'write:users',
    }),
    zValidator(
      'json',
      z.object({
        name: z.string().optional(),
      }),
    ),
    async (c) => {
      const id = Number(c.req.param('id'))
      const data = c.req.valid('json')

      const user = await updateUserById(id, data)

      return generateJsonResponse(c, user)
    },
  )
  .post(
    '/:id/suspend',
    authMiddleware({
      permission: 'write:users',
    }),
    async (c) => {
      const id = Number(c.req.param('id'))

      if (id === c.get('userId')) {
        throw new ServerError({
          statusCode: 400,
          message: 'Failed when trying to suspend user',
          description: "You can't suspend yourself",
        })
      }

      const user = await updateUserById(id, {
        suspendedAt: new Date().toISOString(),
      })

      await db.delete(sessions).where(eq(sessions.userId, id))

      return generateJsonResponse(c, user)
    },
  )
  .post(
    '/:id/restore',
    authMiddleware({
      permission: 'write:users',
    }),
    async (c) => {
      const id = Number(c.req.param('id'))

      const user = await updateUserById(id, {
        suspendedAt: null,
      })

      return generateJsonResponse(c, user)
    },
  )
  .delete(
    '/:id',
    authMiddleware({
      permission: 'write:users',
    }),
    async (c) => {
      const id = Number(c.req.param('id'))

      await db.delete(users).where(eq(users.id, id))

      return generateJsonResponse(c)
    },
  )

export default app
