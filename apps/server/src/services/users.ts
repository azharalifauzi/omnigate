import { isNull, eq, getTableColumns, inArray, and, or } from 'drizzle-orm'
import { db } from '~/lib/db'
import {
  featureFlagAssignments,
  featureFlags,
  organizations,
  users,
  usersToOrganizations,
} from '~/schemas'
import { jsonAggBuildObjectOrEmptyArray } from '~/utils/drizzle'
import { getPermissionByUserId } from './permissions'

export const getUserById = async (userId: number) => {
  const userColumns = getTableColumns(users)

  const user = await db
    .select({
      ...userColumns,
      organizations: jsonAggBuildObjectOrEmptyArray(organizations, {
        ...getTableColumns(organizations),
      }),
    })
    .from(users)
    .leftJoin(usersToOrganizations, eq(users.id, usersToOrganizations.userId))
    .leftJoin(
      organizations,
      eq(organizations.id, usersToOrganizations.organizationId),
    )
    .groupBy(users.id)
    .where(eq(users.id, userId))

  const userData = user[0]

  if (!userData) {
    return null
  }

  const userPermissions = await getPermissionByUserId(userId)
  const featureFlags = await getFeatureFlagsByUserId(
    userId,
    userData.organizations.map((org) => org.id),
  )

  return { ...userData, featureFlags, permissions: userPermissions }
}

const getFeatureFlagsByUserId = async (
  userId: number,
  organizationIds?: number[],
) => {
  const globalFlags = await db.query.featureFlags.findMany({
    where: or(
      isNull(featureFlags.allowOverride),
      eq(featureFlags.allowOverride, 'organization'),
    ),
  })
  const userLevelFlags = await db
    .select({
      ...getTableColumns(featureFlags),
      value: featureFlagAssignments.value,
    })
    .from(featureFlags)
    .leftJoin(
      featureFlagAssignments,
      and(
        eq(featureFlagAssignments.organizationId, featureFlags.id),
        eq(featureFlagAssignments.userId, userId),
      ),
    )
    .groupBy(featureFlags.id, featureFlagAssignments.value)
    .where(eq(featureFlags.allowOverride, 'user'))

  const organizationLevelFlags = await db
    .select({
      ...getTableColumns(featureFlags),
      value: featureFlagAssignments.value,
      organizationId: featureFlagAssignments.organizationId,
    })
    .from(featureFlags)
    .leftJoin(
      featureFlagAssignments,
      eq(featureFlagAssignments.featureFlagId, featureFlags.id),
    )
    .groupBy(
      featureFlags.id,
      featureFlagAssignments.value,
      featureFlagAssignments.organizationId,
    )
    .where(
      inArray(featureFlagAssignments.organizationId, organizationIds ?? []),
    )

  return {
    global: globalFlags,
    user: userLevelFlags,
    organizations: organizationLevelFlags,
  }
}

export const updateUserById = async (
  id: number,
  data: Partial<typeof users.$inferInsert>,
) => {
  const columns = getTableColumns(users)

  const user = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning(columns)

  return user[0]
}

export const isUserSuspended = async (id: number) => {
  const user = await db
    .select({ id: users.id, suspendedAt: users.suspendedAt })
    .from(users)
    .where(eq(users.id, id))

  if (user.length === 0) {
    return false
  }

  return user[0]?.suspendedAt !== null
}

export type User = NonNullable<Awaited<ReturnType<typeof getUserById>>>
