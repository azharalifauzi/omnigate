import { eq, inArray, not } from 'drizzle-orm'
import { testClient } from 'hono/testing'
import { beforeEach, describe, expect, inject, test, vi } from 'vitest'
import app from '~/app'
import { db } from '~/lib/db'
import { permissions } from '~/schemas'
import { DEFAULT_PERMISSIONS } from '~/services/permissions'

const headers = inject('adminUserHeaders')

beforeEach(async () => {
  await db.delete(permissions).where(
    not(
      inArray(
        permissions.key,
        DEFAULT_PERMISSIONS.map((p) => p.key),
      ),
    ),
  )
})

const client = testClient(app)

// Positive test cases
describe('Permission Controller API - Positive Test Cases', () => {
  test('it should return a list of permissions with pagination', async () => {
    const response = await client.api.v1.permission.$get(
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
    expect(data.totalCount).toEqual(DEFAULT_PERMISSIONS.length)
    expect(data.data.length).toEqual(DEFAULT_PERMISSIONS.length)
  })

  test('it should return permission details for a valid permission ID', async () => {
    const response = await client.api.v1.permission.$post(
      {
        json: {
          key: 'test',
          name: 'test',
          description: 'permission description',
        },
      },
      {
        headers,
      },
    )

    const { data: permission } = await response.json()

    const getIdResponse = await client.api.v1.permission[':id'].$get(
      {
        param: {
          id: permission.id.toString(),
        },
      },
      {
        headers,
      },
    )

    const { data } = await getIdResponse.json()

    expect(data.name).toEqual('test')
    expect(data.key).toEqual('test')
    expect(data.description).toEqual('permission description')
  })

  test('it should create a new permission', async () => {
    const response = await client.api.v1.permission.$post(
      {
        json: {
          key: 'approve:account-create',
          name: 'approve:account-create',
        },
      },
      {
        headers,
      },
    )

    const { data } = await response.json()

    const permission = await db.query.permissions.findFirst({
      where: eq(permissions.id, data.id),
    })

    expect(permission?.key).toEqual('approve:account-create')
    expect(permission?.name).toEqual('approve:account-create')
  })

  test('it should update an existing permission', async () => {
    const response = await client.api.v1.permission.$post(
      {
        json: {
          key: 'approve:account-create',
          name: 'approve:account-create',
        },
      },
      {
        headers,
      },
    )

    const { data } = await response.json()

    const permissionBeforeEdit = await db.query.permissions.findFirst({
      where: eq(permissions.id, data.id),
    })

    expect(permissionBeforeEdit?.key).toEqual('approve:account-create')
    expect(permissionBeforeEdit?.name).toEqual('approve:account-create')

    await client.api.v1.permission[':id'].$put(
      {
        param: {
          id: data.id.toString(),
        },
        json: {
          key: 'approve:account-create-edit',
          name: 'approve:account-create-edit',
        },
      },
      {
        headers,
      },
    )

    const permission = await db.query.permissions.findFirst({
      where: eq(permissions.id, data.id),
    })

    expect(permission?.key).toEqual('approve:account-create-edit')
    expect(permission?.name).toEqual('approve:account-create-edit')
  })

  test('it should delete a permission', async () => {
    const response = await client.api.v1.permission.$post(
      {
        json: {
          key: 'approve:account-create',
          name: 'approve:account-create',
        },
      },
      {
        headers,
      },
    )

    const { data } = await response.json()

    const permission = await db.query.permissions.findFirst({
      where: eq(permissions.id, data.id),
    })

    expect(permission).toBeDefined()

    await client.api.v1.permission[':id'].$delete(
      {
        param: {
          id: data.id.toString(),
        },
      },
      {
        headers,
      },
    )

    const permissionAfterDelete = await db.query.permissions.findFirst({
      where: eq(permissions.id, data.id),
    })

    expect(permissionAfterDelete).toBeUndefined()
  })
})

// Negative test cases
describe('Permission Controller API - Negative Test Cases', () => {
  test('it should return 404 for a non-existent permission', async () => {
    const response = await client.api.v1.permission[':id'].$get(
      {
        param: {
          id: '-1',
        },
      },
      { headers },
    )

    expect(response.status).toEqual(404)
  })

  test('it should return 400 for invalid payload on permission creation', async () => {
    const res = await app.request('/api/v1/permission', {
      method: 'POST',
      body: JSON.stringify({
        foo: 'bar',
      }),
      headers,
    })

    expect(res.status).toEqual(400)
  })

  test('it should return 401 for unauthorized access', async () => {
    const response = await client.api.v1.permission[':id'].$get({
      param: {
        id: '123',
      },
    })

    expect(response.status).toEqual(401)
  })

  test('it should return 400 for duplicate key on permission creation', async () => {
    await client.api.v1.permission.$post(
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

    const response = await client.api.v1.permission.$post(
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
