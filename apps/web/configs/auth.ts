import { somePermissions } from '~/utils/auth'

export const AUTH_ROUTE_CONFIG = {
  '/admin': {
    permissions: somePermissions([
      'read:users',
      'write:users',
      'read:roles',
      'write:roles',
      'read:organizations',
      'write:organizations',
      'read:permissions',
      'write:permissions',
    ]),
  },
  '/admin/users': {
    permissions: somePermissions(['read:users', 'write:users']),
  },
  '/admin/users/[id]': {
    permissions: somePermissions(['read:users', 'write:users']),
  },
  '/admin/users/[id]/roles': {
    permissions: somePermissions(['read:users', 'write:users']),
  },
  '/admin/organizations': {
    permissions: somePermissions(['read:organizations', 'write:organizations']),
  },
  '/admin/organizations/[id]': {
    permissions: somePermissions(['read:organizations', 'write:organizations']),
  },
  '/admin/organizations/[id]/users': {
    permissions: somePermissions(['read:organizations', 'write:organizations']),
  },
  '/admin/roles': {
    permissions: somePermissions(['read:roles', 'write:roles']),
  },
  '/admin/permissions': {
    permissions: somePermissions(['read:permissions', 'write:permissions']),
  },
}
