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

await migrate(db, {
  migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
})

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
  .returning()

const roleId = role[0]!.id

const permissions = await db
  .insert(permissionTable)
  .values([
    {
      name: 'write:users',
      key: 'write:users',
    },
    {
      name: 'read:users',
      key: 'read:users',
    },
    {
      name: 'write:organizations',
      key: 'write:organizations',
    },
    {
      name: 'read:organizations',
      key: 'read:organizations',
    },
    {
      name: 'write:roles',
      key: 'write:roles',
    },
    {
      name: 'read:roles',
      key: 'read:roles',
    },
    {
      name: 'write:permissions',
      key: 'write:permissions',
    },
    {
      name: 'read:permissions',
      key: 'read:permissions',
    },
  ])
  .returning()

await db.insert(permissionsToRoles).values(
  permissions.map(({ id }) => ({
    roleId,
    permissionId: id,
  })),
)
