import { type User } from '@repo/server'
import { headers } from 'next/headers'
import { type Permission } from './auth'

export const getServerSideUserObject = () => {
  const userObject = headers().get('User-Object')

  const user = userObject ? (JSON.parse(userObject) as User) : null

  function getPermission(
    permission: string | ((permissions: Permission[]) => boolean),
    orgId?: number,
  ) {
    const orgPermissions = user?.permissions.find((p) => {
      if (!orgId) {
        return p.isDefaultOrg
      }

      return p.orgId === orgId
    })

    if (!orgPermissions) {
      return false
    }

    if (typeof permission === 'string') {
      return orgPermissions.permissions.some(({ key }) => {
        return key === permission
      })
    }

    return permission(orgPermissions.permissions)
  }

  return {
    user,
    getPermission,
  }
}
