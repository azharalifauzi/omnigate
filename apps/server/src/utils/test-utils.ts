import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import { db } from '~/lib/db'
import {
  organizations,
  roles,
  rolesToUsers,
  sessions,
  users,
  usersToOrganizations,
} from '~/schemas'
import { createSessionToken } from './session'
import { v4 as uuidv4 } from 'uuid'

export const createUserWithRole = async (
  name: string,
  email: string,
  roleKey?: 'admin',
) => {
  const user = await db
    .insert(users)
    .values({
      name,
      email,
    })
    .returning()

  const userId = user[0]!.id

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.isDefault, true),
  })

  const orgId = organization!.id

  await db.insert(usersToOrganizations).values({
    userId,
    organizationId: orgId,
  })

  if (roleKey) {
    const role = await db.query.roles.findFirst({
      where: eq(roles.key, roleKey),
    })

    if (role) {
      await db.insert(rolesToUsers).values({
        userId,
        roleId: role.id,
        organizationId: orgId,
      })
    }
  }

  const sessionToken = createSessionToken(uuidv4())

  await db.insert(sessions).values({
    userId,
    sessionToken,
    expiresAt: dayjs().add(7, 'days').toISOString(),
  })

  return sessionToken
}
