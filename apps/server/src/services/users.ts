import { eq, getTableColumns } from 'drizzle-orm'
import { db } from '~/lib/db'
import { organizations, users, usersToOrganizations } from '~/schemas'
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

  const userPermissions = await getPermissionByUserId(userId)

  if (!user[0]) {
    return null
  }

  return { ...user[0], permissions: userPermissions }
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
