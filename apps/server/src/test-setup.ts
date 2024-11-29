import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db } from './lib/db'
import {
  authMethods,
  organizations,
  otpTokens,
  permissionsToRoles,
  permissions as permissionTable,
  roles,
  rolesToUsers,
  sessions,
  users,
  usersToOrganizations,
} from './schemas'
import { fileURLToPath } from 'url'
import type { GlobalSetupContext } from 'vitest/node'
import { DEFAULT_PERMISSIONS } from './services/permissions'
import { createUserWithRole } from './utils/test-utils'
import { env } from './env'

async function cleanUpDatabase() {
  await db.delete(users)
  await db.delete(organizations)
  await db.delete(roles)
  await db.delete(permissionTable)
  await db.delete(usersToOrganizations)
  await db.delete(rolesToUsers)
  await db.delete(permissionsToRoles)
  await db.delete(sessions)
  await db.delete(otpTokens)
  await db.delete(authMethods)
}

export default async function setup({ provide }: GlobalSetupContext) {
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
  })

  await cleanUpDatabase()

  await db.insert(organizations).values({
    name: 'Default Organization',
    isDefault: true,
  })

  const role = await db
    .insert(roles)
    .values({
      key: 'admin',
      name: 'Admin',
    })
    .onConflictDoNothing()
    .returning()

  const roleId = role[0]!.id

  const permissions = await db
    .insert(permissionTable)
    .values(DEFAULT_PERMISSIONS)
    .onConflictDoNothing()
    .returning()

  await db
    .insert(permissionsToRoles)
    .values(
      permissions.map(({ id }) => ({
        roleId,
        permissionId: id,
      })),
    )
    .onConflictDoNothing()

  const { sessionToken } = await createUserWithRole(
    'Admin',
    'admin@sidrstudio.com',
    'admin',
  )
  const headers: Record<string, string> = {}
  headers['Cookie'] = `${env.SESSION_COOKIE_NAME}=${sessionToken}`

  provide('adminUserHeaders', headers)
}

declare module 'vitest' {
  export interface ProvidedContext {
    adminUserHeaders: Record<string, string>
  }
}
