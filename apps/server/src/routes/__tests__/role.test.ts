import { describe, test, expect, beforeEach, vi, beforeAll } from 'vitest'
import app from '~/app'
import { testClient } from 'hono/testing'
import { db } from '~/lib/db'
import { roles } from '~/schemas'
import { createUserWithRole } from '~/utils/test-utils'
import { env } from '~/env'
import { eq, not } from 'drizzle-orm'

const headers: Record<string, string> = {}

beforeAll(async () => {
  const token = await createUserWithRole(
    'Admin',
    'admin@sidrstudio.com',
    'admin',
  )

  headers['Cookie'] = `${env.SESSION_COOKIE_NAME}=${token}`
})

// Mock database operations
beforeEach(async () => {
  vi.clearAllMocks()
  await db.delete(roles).where(not(eq(roles.key, 'admin')))
  // Setup any necessary mock or reset state
})

// Positive test cases
describe('Role Controller API - Positive Test Cases', () => {
  test('it should return a list of roles with pagination', async () => {
    await db.insert(roles).values([
      { key: 'test', name: 'test' },
      {
        key: 'test2',
        name: 'test2',
      },
    ])

    const response = await testClient(app).api.v1.role.$get(
      {
        query: {
          page: '1',
          size: '10',
        },
      },
      {
        headers,
      },
    )

    const { data } = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('data')
    expect(data).toHaveProperty('pageCount')
    expect(data).toHaveProperty('totalCount')
    expect(data.pageCount).toEqual(1)
    // The reason there's 3 because there's default "admin" role in test setup
    expect(data.totalCount).toEqual(3)
    expect(data.data.length).toEqual(3)
  })

  test('it should return role details for a valid role ID', async () => {})

  test('it should create a new role', async () => {})

  test('it should update an existing role', async () => {})

  test('it should delete a role', async () => {})
})

// Negative test cases
describe('Role Controller API - Negative Test Cases', () => {
  test('it should return 404 for a non-existent role', async () => {})

  test('it should return 400 for invalid payload on role creation', async () => {})

  test('it should return 403 for unauthorized access', async () => {})

  test('it should return 400 for duplicate key on role creation', async () => {})

  test('it should return 400 for invalid permission IDs during assignment', async () => {})
})
