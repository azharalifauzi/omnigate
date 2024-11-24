import { db } from '~/lib/db'
import { getPermissionByUserId, Permission } from '~/services/permissions'
import dayjs from 'dayjs'
import { type Context } from 'hono'
import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { ServerError } from '../lib/error'
import { env } from '~/env'
import { isUserSuspended } from '~/services/users'

interface AuthMiddlewareOptions {
  permission?: string | ((permissions: Permission[]) => boolean)
}

export const authMiddleware = (options: AuthMiddlewareOptions = {}) =>
  createMiddleware<{
    Variables: {
      userId: number
    }
    Bindings: any
  }>(async (c, next) => {
    const session = await checkSession(c)

    if (!session) {
      throw new ServerError({
        statusCode: 401,
        message: 'User is not authenticated',
      })
    }

    if (await isUserSuspended(session.userId)) {
      throw new ServerError({
        statusCode: 403,
        message: 'Access forbidden',
        description: 'Your account is suspended',
      })
    }

    if (options.permission) {
      const isGranted = await checkPermission(
        options.permission,
        session.userId,
      )

      if (!isGranted) {
        throw new ServerError({
          statusCode: 401,
          message: 'User is not authenticated',
        })
      }
    }

    c.set('userId', session.userId)

    return await next()
  })

export async function checkSession(c: Context) {
  const sessionToken = getCookie(c, env.SESSION_COOKIE_NAME)

  if (!sessionToken) {
    return null
  }

  return checkSessionBySessionToken(sessionToken)
}

export async function checkSessionBySessionToken(sessionToken: string) {
  const session = await db.query.sessions.findFirst({
    where: (session, { eq }) => eq(session.sessionToken, sessionToken),
  })

  if (!session) {
    return null
  }

  if (dayjs(session.expiresAt.split(' ').join('T') + 'Z').isBefore(dayjs())) {
    return null
  }

  return session
}

async function checkPermission(
  permission: string | ((permissions: Permission[]) => boolean),
  userId: number,
) {
  const userPermissions = await getPermissionByUserId(userId)

  const defaultOrgPermission = userPermissions.find(
    ({ isDefaultOrg }) => isDefaultOrg,
  )

  if (!defaultOrgPermission) {
    return false
  }

  if (typeof permission === 'string') {
    const isGranted = defaultOrgPermission.permissions.some(({ key }) => {
      return key === permission
    })
    return isGranted
  }

  return permission(defaultOrgPermission.permissions)
}
