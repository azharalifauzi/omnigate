import { type User } from '@repo/server'
import { createContext, useContext } from 'react'
import { type Permission } from '~/utils/auth'

export const UserContext = createContext<User | null>(null)

export const useUser = () => {
  const user = useContext(UserContext)

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
