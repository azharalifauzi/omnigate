import { eq, not } from 'drizzle-orm'
import { testClient } from 'hono/testing'
import { beforeEach, describe, expect, inject, test, vi } from 'vitest'
import app from '~/app'
import { db } from '~/lib/db'
import { roles } from '~/schemas'

const headers = inject('adminUserHeaders')

// Mock database operations
beforeEach(async () => {
  vi.clearAllMocks()
  await db.delete(roles).where(not(eq(roles.key, 'admin')))
})

const client = testClient(app)

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

    const response = await client.api.v1.role.$get(
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

  test('it should return role details for a valid role ID', async () => {
    const response = await client.api.v1.role.$post(
      {
        json: {
          key: 'test',
          name: 'test',
          description: 'role description',
        },
      },
      {
        headers,
      },
    )

    const { data: role } = await response.json()

    const getIdResponse = await client.api.v1.role[':id'].$get(
      {
        param: {
          id: role.id.toString(),
        },
      },
      {
        headers,
      },
    )

    const { data } = await getIdResponse.json()

    expect(data.name).toEqual('test')
    expect(data.key).toEqual('test')
    expect(data.description).toEqual('role description')
  })

  test('it should create a new role', async () => {
    const response = await client.api.v1.role.$post(
      {
        json: {
          key: 'financial-approver',
          name: 'financial-approver',
        },
      },
      {
        headers,
      },
    )

    const { data } = await response.json()

    const role = await db.query.roles.findFirst({
      where: eq(roles.id, data.id),
    })

    expect(role?.key).toEqual('financial-approver')
    expect(role?.name).toEqual('financial-approver')
  })

  test('it should update an existing role', async () => {
    const response = await client.api.v1.role.$post(
      {
        json: {
          key: 'financial-approver',
          name: 'financial-approver',
        },
      },
      {
        headers,
      },
    )

    const { data } = await response.json()

    const roleBeforeEdit = await db.query.roles.findFirst({
      where: eq(roles.id, data.id),
    })

    expect(roleBeforeEdit?.key).toEqual('financial-approver')
    expect(roleBeforeEdit?.name).toEqual('financial-approver')

    await client.api.v1.role[':id'].$put(
      {
        param: {
          id: data.id.toString(),
        },
        json: {
          key: 'financial-approver-edit',
          name: 'financial-approver-edit',
        },
      },
      {
        headers,
      },
    )

    const role = await db.query.roles.findFirst({
      where: eq(roles.id, data.id),
    })

    expect(role?.key).toEqual('financial-approver-edit')
    expect(role?.name).toEqual('financial-approver-edit')
  })

  test('it should delete a role', async () => {
    const response = await client.api.v1.role.$post(
      {
        json: {
          key: 'financial-approver',
          name: 'financial-approver',
        },
      },
      {
        headers,
      },
    )

    const { data } = await response.json()

    const role = await db.query.roles.findFirst({
      where: eq(roles.id, data.id),
    })

    expect(role).toBeDefined()

    await client.api.v1.role[':id'].$delete(
      {
        param: {
          id: data.id.toString(),
        },
      },
      {
        headers,
      },
    )

    const roleAfterDelete = await db.query.roles.findFirst({
      where: eq(roles.id, data.id),
    })

    expect(roleAfterDelete).toBeUndefined()
  })
})

// Negative test cases
describe('Role Controller API - Negative Test Cases', () => {
  test('it should return 404 for a non-existent role', async () => {
    const response = await client.api.v1.role[':id'].$get(
      {
        param: {
          id: '-1',
        },
      },
      { headers },
    )

    expect(response.status).toEqual(404)
  })

  test('it should return 400 for invalid payload on role creation', async () => {
    const res = await app.request('/api/v1/role', {
      method: 'POST',
      body: JSON.stringify({
        foo: 'bar',
      }),
      headers,
    })

    expect(res.status).toEqual(400)
  })

  test('it should return 401 for unauthorized access', async () => {
    const response = await client.api.v1.role[':id'].$get({
      param: {
        id: '123',
      },
    })

    expect(response.status).toEqual(401)
  })

  test('it should return 400 for duplicate key on role creation', async () => {
    await client.api.v1.role.$post(
      {
        json: {
          key: 'financial-approver',
          name: 'financial-approver',
        },
      },
      {
        headers,
      },
    )

    const response = await client.api.v1.role.$post(
      {
        json: {
          key: 'financial-approver',
          name: 'financial-approver',
        },
      },
      {
        headers,
      },
    )

    expect(response.status).toEqual(400)
  })
})
