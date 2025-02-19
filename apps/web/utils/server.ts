import { type User } from '@repo/server'
import { headers } from 'next/headers'
import { type Permission } from './auth'

export const getUserServerSession = async () => {
  const userObject = (await headers()).get('User-Object')

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

  function getFeatureFlag(featureFlag: string, orgId?: number) {
    const userLevelFlag = user?.featureFlags.user.find(
      (f) => f.key === featureFlag,
    )

    if (userLevelFlag) {
      return userLevelFlag.value ?? userLevelFlag.defaultValue
    }

    if (orgId) {
      const orgLevelFlag = user?.featureFlags.organizations.find(
        (f) => f.key === featureFlag && f.organizationId === orgId,
      )

      if (orgLevelFlag) {
        return orgLevelFlag.value ?? orgLevelFlag.defaultValue
      }
    }

    return (
      user?.featureFlags.global.find((f) => f.key === featureFlag)
        ?.defaultValue ?? false
    )
  }

  return {
    user,
    getPermission,
    getFeatureFlag,
  }
}
