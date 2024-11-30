import { db } from '~/lib/db'
import { authMiddleware } from '~/middlewares/auth'
import {
  featureFlagAssignments,
  featureFlags,
  organizations,
  users,
  usersToOrganizations,
} from '~/schemas'
import { zValidator } from '@hono/zod-validator'
import { and, count, desc, eq, getTableColumns } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { generateJsonResponse } from '../lib/response'
import { ServerError } from '~/lib/error'
import { everyPermissions } from '~/services/permissions'

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

      if (!organization) {
        throw new ServerError({
          statusCode: 404,
          message: 'Failed to get organization',
          description: "Organization you're looking for is not found",
        })
      }

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
      const organization = await db
        .insert(organizations)
        .values(data)
        .returning()

      return generateJsonResponse(c, organization[0], 201)
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
  .get(
    '/:id/feature-flags',
    zValidator(
      'query',
      z.object({
        page: z.number({ coerce: true }).optional(),
        size: z.number({ coerce: true }).optional(),
      }),
    ),
    authMiddleware({
      permission: everyPermissions(['read:feature-flags', 'read:users']),
    }),
    async (c) => {
      const { page = 1, size = 10 } = c.req.valid('query')
      const userId = Number(c.req.param('id'))
      const skip = (page - 1) * size

      const totalCount = await db
        .select({
          count: count(),
        })
        .from(featureFlags)
        .where(eq(featureFlags.allowOverride, 'organization'))

      const pageCount = Math.ceil(totalCount[0]!.count / size)

      const data = await db
        .select({
          ...getTableColumns(featureFlags),
          value: featureFlagAssignments.value,
        })
        .from(featureFlags)
        .leftJoin(
          featureFlagAssignments,
          eq(featureFlagAssignments.userId, userId),
        )
        .where(eq(featureFlags.allowOverride, 'organization'))
        .groupBy(featureFlags.id)
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
  .post(
    '/:id/feature-flags',
    zValidator(
      'json',
      z.object({
        featureFlagId: z.number({ coerce: true }),
        value: z.boolean().optional(),
      }),
    ),
    authMiddleware({
      permission: everyPermissions([
        'write:organizations',
        'write:feature-flags',
      ]),
    }),
    async (c) => {
      const { featureFlagId, value } = c.req.valid('json')
      const organizationId = Number(c.req.param('id'))

      const existingFeatureFlag = await db.query.featureFlags.findFirst({
        where: eq(featureFlags.id, featureFlagId),
      })

      if (!existingFeatureFlag) {
        throw new ServerError({
          statusCode: 404,
          message: 'Failed to assign feature flag',
          data: 'Feature flag is not found',
        })
      }

      if (existingFeatureFlag.allowOverride !== 'user') {
        throw new ServerError({
          statusCode: 400,
          message: 'Failed to assign feature flag',
          data: 'Feature flag cannot be assigned to user',
        })
      }

      const existingAssignment =
        await db.query.featureFlagAssignments.findFirst({
          where: and(
            eq(featureFlagAssignments.featureFlagId, featureFlagId),
            eq(featureFlagAssignments.organizationId, organizationId),
          ),
        })

      if (!existingAssignment) {
        const data = await db
          .insert(featureFlagAssignments)
          .values({
            featureFlagId,
            organizationId,
            value,
          })
          .returning()

        return generateJsonResponse(c, data[0], 201)
      }

      const data = await db
        .update(featureFlagAssignments)
        .set({
          value: value !== undefined ? value : null,
        })
        .where(
          and(
            eq(featureFlagAssignments.featureFlagId, featureFlagId),
            eq(featureFlagAssignments.organizationId, organizationId),
          ),
        )
        .returning()

      return generateJsonResponse(c, data[0])
    },
  )

export default app
