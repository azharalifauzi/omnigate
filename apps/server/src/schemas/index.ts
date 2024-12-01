import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  email: text('email').unique().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  suspendedAt: timestamp('suspended_at', { mode: 'string' }),
  image: text('image'),
  isEmailVerified: boolean('is_email_verified').default(false),
})

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  isDefault: boolean('is_default').default(false),
})

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  key: varchar('key', { length: 256 }).unique().notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  assignedOnSignUp: boolean('assigned_on_signup').default(false),
})

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  key: varchar('key', { length: 256 }).unique().notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
})

export const usersToOrganizations = pgTable(
  'users_to_organizations',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    organizationId: integer('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.organizationId] })],
)

export const rolesToUsers = pgTable(
  'roles_to_users',
  {
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    organizationId: integer('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId, t.organizationId] })],
)

export const permissionsToRoles = pgTable(
  'permissions_to_roles',
  {
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: integer('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
)

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  sessionToken: text('session_token').unique(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 255 }),
})

export const otpTokens = pgTable('otp_tokens', {
  id: serial('id').primaryKey(),
  token: text('token').unique().notNull(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, {
      onDelete: 'cascade',
    }),
  expiredAt: timestamp('expired_at', {
    mode: 'string',
  }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  otp: varchar('otp', { length: 6 }).notNull(),
})

export const authMethods = pgTable('auth_methods', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, {
      onDelete: 'cascade',
    }),
  provider: varchar('provider', { length: 50 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
})

export const featureFlags = pgTable('feature_flags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  key: varchar('key', { length: 255 }).notNull().unique(),
  defaultValue: boolean().default(false).notNull(),
  allowOverride: varchar('allow_override', { enum: ['user', 'organization'] }),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
})

export const featureFlagAssignments = pgTable(
  'feature_flag_assignments',
  {
    id: serial('id').primaryKey(), // Surrogate primary key
    featureFlagId: integer('feature_flag_id')
      .references(() => featureFlags.id, { onDelete: 'cascade' })
      .notNull(),
    userId: integer('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    organizationId: integer('organization_id').references(
      () => organizations.id,
      { onDelete: 'cascade' },
    ),
    value: boolean('value'),
  },
  (table) => [
    unique('feature_flag_assignments_unique').on(
      table.featureFlagId,
      table.userId,
      table.organizationId,
    ),
    check(
      'valid_user_or_org',
      sql`
        (${table.userId} IS NOT NULL AND ${table.organizationId} IS NULL) OR
        (${table.userId} IS NULL AND ${table.organizationId} IS NOT NULL)
      `,
    ),
  ],
)
