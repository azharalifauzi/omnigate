/* NOTE: this script should run one-time only, when first time create the app */

import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '~/schemas'
import pg from 'pg'
import { eq } from 'drizzle-orm'
import { isEmail } from '~/utils'
import { DEFAULT_PERMISSIONS } from '~/services/permissions'

export const client = new pg.Client(process.env.DATABASE_URL)
console.log('Connect to DB')
await client.connect()
export const db = drizzle(client, { schema })
console.log('Start seeding')

let isDbSeeded = true

const initialUserEmail = process.env.INITIAL_USER_EMAIL
const initialUserName = process.env.INITIAL_USER_NAME

if (!initialUserEmail) {
  throw new Error('Please add INITIAL_USER_EMAIL on .env file')
}

if (!initialUserName) {
  throw new Error('Please add INITIAL_USER_NAME on .env file')
}

if (!isEmail(initialUserEmail)) {
  throw new Error(
    'Looks like INITIAL_USER_EMAIL format is invalid, it should be an email',
  )
}

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
    email: initialUserEmail,
    name: initialUserName,
    isEmailVerified: true,
  })
  .onConflictDoNothing()
  .returning()

if (isDbSeeded) {
  superAdmin = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, initialUserEmail))
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

const permissions = await db
  .insert(schema.permissions)
  .values(DEFAULT_PERMISSIONS)
  .onConflictDoNothing()
  .returning()

const promises = permissions.map(async (permission) => {
  await db
    .insert(schema.permissionsToRoles)
    .values({
      roleId: superAdminRole[0]!.id,
      permissionId: permission.id,
    })
    .onConflictDoNothing()
})

await Promise.all(promises)

console.log('Seeding end')
await client.end()
console.log('Connection closed')
