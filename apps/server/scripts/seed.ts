/* NOTE: this script should run one-time only, when first time create the app */

import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '~/schemas'
import pg from 'pg'
import { eq } from 'drizzle-orm'

export const client = new pg.Client(process.env.DATABASE_URL)
console.log('Connect to DB')
await client.connect()
export const db = drizzle(client, { schema })
console.log('Start seeding')

let isDbSeeded = true

let defaultOrg = await db
  .select()
  .from(schema.organizations)
  .where(eq(schema.organizations.isDefault, true))

if (defaultOrg.length === 0) {
  isDbSeeded = false
  defaultOrg = await db
    .insert(schema.organizations)
    .values({
      name: 'Default Organization',
      isDefault: true,
    })
    .returning()
}

console.log(`Default Organization ID: ${defaultOrg[0]!.id}`)

let superAdmin = await db
  .insert(schema.users)
  .values({
    email: 'admin@acme.com',
    name: 'Admin',
    isEmailVerified: true,
  })
  .onConflictDoNothing()
  .returning()

if (isDbSeeded) {
  superAdmin = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, 'admin@acme.com'))
}
let superAdminRole = await db
  .insert(schema.roles)
  .values({
    name: 'Super Admin',
    key: 'super-admin',
  })
  .onConflictDoNothing()
  .returning()

if (isDbSeeded) {
  superAdminRole = await db
    .select()
    .from(schema.roles)
    .where(eq(schema.roles.key, 'super-admin'))
}

await db
  .insert(schema.usersToOrganizations)
  .values({
    organizationId: defaultOrg[0]!.id,
    userId: superAdmin[0]!.id,
  })
  .onConflictDoNothing()

await db
  .insert(schema.rolesToUsers)
  .values({
    roleId: superAdminRole[0]!.id,
    userId: superAdmin[0]!.id,
    organizationId: defaultOrg[0]!.id,
  })
  .onConflictDoNothing()

const readUser = await db
  .insert(schema.permissions)
  .values({
    name: 'Read users',
    key: 'read:users',
  })
  .onConflictDoNothing()
  .returning()
const writedUser = await db
  .insert(schema.permissions)
  .values({
    name: 'Write users',
    key: 'write:users',
  })
  .onConflictDoNothing()
  .returning()
const readRoles = await db
  .insert(schema.permissions)
  .values({
    name: 'Read roles',
    key: 'read:roles',
  })
  .onConflictDoNothing()
  .returning()
const writeRoles = await db
  .insert(schema.permissions)
  .values({
    name: 'Write roles',
    key: 'write:roles',
  })
  .onConflictDoNothing()
  .returning()
const readPermissions = await db
  .insert(schema.permissions)
  .values({
    name: 'Read permissions',
    key: 'read:permissions',
  })
  .onConflictDoNothing()
  .returning()
const writePermissions = await db
  .insert(schema.permissions)
  .values({
    name: 'Write permissions',
    key: 'write:permissions',
  })
  .onConflictDoNothing()
  .returning()
const readOrgs = await db
  .insert(schema.permissions)
  .values({
    name: 'Read organizations',
    key: 'read:organizations',
  })
  .onConflictDoNothing()
  .returning()
const writeOrgs = await db
  .insert(schema.permissions)
  .values({
    name: 'Write organizations',
    key: 'write:organizations',
  })
  .onConflictDoNothing()
  .returning()

const permissions = {
  readUser,
  writedUser,
  readRoles,
  writeRoles,
  readPermissions,
  writePermissions,
  readOrgs,
  writeOrgs,
}

const promises = Object.values(permissions).map(async (p) => {
  const data = p[0]

  if (!data) {
    return
  }

  await db
    .insert(schema.permissionsToRoles)
    .values({
      roleId: superAdminRole[0]!.id,
      permissionId: data.id,
    })
    .onConflictDoNothing()
})

await Promise.all(promises)

console.log('Seeding end')
await client.end()
console.log('Connection closed')
