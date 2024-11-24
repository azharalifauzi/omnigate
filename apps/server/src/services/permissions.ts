import { db } from '~/lib/db'
import {
  organizations,
  permissions,
  permissionsToRoles,
  roles,
  rolesToUsers,
} from '~/schemas'
import { jsonAggBuildObjectOrEmptyArray } from '../utils/drizzle'
import { eq } from 'drizzle-orm'

export const getPermissionByUserId = async (userId: number) => {
  const userPermissions = await db
    .select({
      orgId: organizations.id,
      isDefaultOrg: organizations.isDefault,
      permissions: jsonAggBuildObjectOrEmptyArray(permissions, {
        key: permissions.key,
      }),
    })
    .from(organizations)
    .leftJoin(rolesToUsers, eq(organizations.id, rolesToUsers.organizationId))
    .leftJoin(roles, eq(rolesToUsers.roleId, roles.id))
    .leftJoin(permissionsToRoles, eq(roles.id, permissionsToRoles.roleId))
    .leftJoin(permissions, eq(permissionsToRoles.permissionId, permissions.id))
    .groupBy(organizations.id)
    .where(eq(rolesToUsers.userId, userId))

  return userPermissions
}

export interface Permission {
  key: string
}

export function somePermissions(permissions: string[]) {
  return (p: Permission[]) => {
    return p.some(({ key }) => {
      return permissions.includes(key)
    })
  }
}

export function everyPermissions(permissions: string[]) {
  return (p: Permission[]) => {
    return p.every(({ key }) => {
      return permissions.includes(key)
    })
  }
}
