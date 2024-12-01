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
    const onlyKeys = p.map((p) => p.key)
    return permissions.some((permission) => onlyKeys.includes(permission))
  }
}

export function everyPermissions(permissions: string[]) {
  return (p: Permission[]) => {
    const onlyKeys = p.map((p) => p.key)
    return permissions.every((permission) => onlyKeys.includes(permission))
  }
}

export const DEFAULT_PERMISSIONS = [
  {
    name: 'Write users',
    key: 'write:users',
  },
  {
    name: 'Read users',
    key: 'read:users',
  },
  {
    name: 'Write organizations',
    key: 'write:organizations',
  },
  {
    name: 'Read organizations',
    key: 'read:organizations',
  },
  {
    name: 'Write roles',
    key: 'write:roles',
  },
  {
    name: 'Read roles',
    key: 'read:roles',
  },
  {
    name: 'Write permissions',
    key: 'write:permissions',
  },
  {
    name: 'Read permissions',
    key: 'read:permissions',
  },
  {
    name: 'Read feature flags',
    key: 'read:feature-flags',
  },
  {
    name: 'Write feature flags',
    key: 'write:feature-flags',
  },
]
