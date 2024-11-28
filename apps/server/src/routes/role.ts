import { db } from '~/lib/db'
import { authMiddleware } from '~/middlewares/auth'
import { permissions, permissionsToRoles, roles, rolesToUsers } from '~/schemas'
import { jsonAggBuildObjectOrEmptyArray } from '../utils/drizzle'
import { zValidator } from '@hono/zod-validator'
import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  getTableColumns,
  inArray,
} from 'drizzle-orm'
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
      permission: 'read:roles',
    }),
    async (c) => {
      const { page = 1, size = 10 } = c.req.valid('query')
      const skip = (page - 1) * size

      const totalCount = await db
        .select({
          count: count(),
        })
        .from(roles)

      const pageCount = Math.ceil(totalCount[0]!.count / size)

      const data = await db
        .select({
          id: roles.id,
          name: roles.name,
          key: roles.key,
          description: roles.description,
          createdAt: roles.createdAt,
          usersAssigned: countDistinct(rolesToUsers.userId),
          permissions: jsonAggBuildObjectOrEmptyArray(permissions, {
            ...getTableColumns(permissions),
          }),
        })
        .from(roles)
        .leftJoin(rolesToUsers, eq(roles.id, rolesToUsers.roleId))
        .leftJoin(permissionsToRoles, eq(roles.id, permissionsToRoles.roleId))
        .leftJoin(
          permissions,
          eq(permissionsToRoles.permissionId, permissions.id),
        )
        .groupBy(roles.id)
        .limit(size)
        .offset(skip)
        .orderBy(desc(roles.createdAt))

      return generateJsonResponse(c, {
        data,
        pageCount,
        totalCount: totalCount[0]!.count,
      })
    },
  )
  .get('/:id', authMiddleware({ permission: 'read:roles' }), async (c) => {
    const id = c.req.param('id')
    const role = await db.query.roles.findFirst({
      where: (role, { eq }) => eq(role.id, Number(id)),
    })

    if (!role) {
      throw new ServerError({
        statusCode: 404,
        message: 'Failed to get role',
        description: "Role you're looking for is not found",
      })
    }

    return generateJsonResponse(c, role)
  })
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
      permission: 'write:roles',
    }),
    async (c) => {
      const data = c.req.valid('json')

      try {
        const role = await db.insert(roles).values(data).returning()

        return generateJsonResponse(c, role[0], 201)
      } catch (err) {
        const error = err as any
        if (error.constraint === 'roles_key_unique') {
          throw new ServerError({
            statusCode: 400,
            message: 'Something wrong when creating role',
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
      permission: 'write:roles',
    }),
    async (c) => {
      const id = c.req.param('id')
      const data = c.req.valid('json')

      try {
        const role = await db
          .update(roles)
          .set(data)
          .where(eq(roles.id, Number(id)))
          .returning()

        return generateJsonResponse(c, role[0])
      } catch (err) {
        const error = err as any
        if (error.constraint === 'roles_key_unique') {
          throw new ServerError({
            statusCode: 400,
            message: 'Something wrong when editing role',
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
      permission: 'write:roles',
    }),
    async (c) => {
      const id = c.req.param('id')
      await db.delete(roles).where(eq(roles.id, Number(id)))

      return generateJsonResponse(c)
    },
  )
  .post(
    '/assign-permission/:id',
    zValidator(
      'json',
      z.object({
        permissionIds: z.array(z.number({ coerce: true })),
      }),
    ),
    authMiddleware({
      permission: 'write:roles',
    }),
    async (c) => {
      const id = c.req.param('id')
      const data = c.req.valid('json')

      if (data.permissionIds.length === 0) {
        return generateJsonResponse(c)
      }

      await db.insert(permissionsToRoles).values(
        data.permissionIds.map((permissionId) => ({
          permissionId,
          roleId: Number(id),
        })),
      )

      return generateJsonResponse(c)
    },
  )
  .post(
    '/unassign-permission/:id',
    zValidator(
      'json',
      z.object({
        permissionIds: z.array(z.number({ coerce: true })),
      }),
    ),
    authMiddleware({
      permission: 'write:roles',
    }),
    async (c) => {
      const id = c.req.param('id')
      const data = c.req.valid('json')

      if (data.permissionIds.length === 0) {
        return generateJsonResponse(c)
      }

      await db
        .delete(permissionsToRoles)
        .where(
          and(
            eq(permissionsToRoles.roleId, Number(id)),
            inArray(permissionsToRoles.permissionId, data.permissionIds),
          ),
        )

      return generateJsonResponse(c)
    },
  )

export default app
