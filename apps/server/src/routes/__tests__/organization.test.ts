import { eq, not } from 'drizzle-orm'
import { testClient } from 'hono/testing'
import { beforeEach, describe, expect, inject, test } from 'vitest'
import app from '~/app'
import { db } from '~/lib/db'
import { organizations } from '~/schemas'

const headers = inject('adminUserHeaders')

beforeEach(async () => {
  await db.delete(organizations).where(not(eq(organizations.isDefault, true)))
})

const client = testClient(app)

// Positive test cases
describe('organization Controller API - Positive Test Cases', () => {
  test('it should return a list of organizations with pagination', async () => {
    const response = await client.api.v1.organization.$get(
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
    expect(data.totalCount).toEqual(1)
    expect(data.data.length).toEqual(1)
  })

  test('it should return organization details for a valid organization ID', async () => {
    const response = await client.api.v1.organization.$post(
      {
        json: {
          name: 'test',
        },
      },
      {
        headers,
      },
    )

    const { data: organization } = await response.json()

    const getIdResponse = await client.api.v1.organization[':id'].$get(
      {
        param: {
          id: organization.id.toString(),
        },
      },
      {
        headers,
      },
    )

    const { data } = await getIdResponse.json()

    expect(data.name).toEqual('test')
  })

  test('it should create a new organization', async () => {
    const response = await client.api.v1.organization.$post(
      {
        json: {
          name: 'test-org',
        },
      },
      {
        headers,
      },
    )

    const { data } = await response.json()

    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, data.id),
    })

    expect(organization?.name).toEqual('test-org')
  })

  test('it should update an existing organization', async () => {
    const response = await client.api.v1.organization.$post(
      {
        json: {
          name: 'test-org',
        },
      },
      {
        headers,
      },
    )

    const { data } = await response.json()

    const organizationBeforeEdit = await db.query.organizations.findFirst({
      where: eq(organizations.id, data.id),
    })

    expect(organizationBeforeEdit?.name).toEqual('test-org')

    await client.api.v1.organization[':id'].$put(
      {
        param: {
          id: data.id.toString(),
        },
        json: {
          name: 'test-org-edit',
        },
      },
      {
        headers,
      },
    )

    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, data.id),
    })

    expect(organization?.name).toEqual('test-org-edit')
  })

  test('it should delete a organization', async () => {
    const response = await client.api.v1.organization.$post(
      {
        json: {
          name: 'test-org',
        },
      },
      {
        headers,
      },
    )

    const { data } = await response.json()

    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, data.id),
    })

    expect(organization).toBeDefined()

    await client.api.v1.organization[':id'].$delete(
      {
        param: {
          id: data.id.toString(),
        },
      },
      {
        headers,
      },
    )

    const organizationAfterDelete = await db.query.organizations.findFirst({
      where: eq(organizations.id, data.id),
    })

    expect(organizationAfterDelete).toBeUndefined()
  })
})

// Negative test cases
describe('organization Controller API - Negative Test Cases', () => {
  test('it should return 404 for a non-existent organization', async () => {
    const response = await client.api.v1.organization[':id'].$get(
      {
        param: {
          id: '-1',
        },
      },
      { headers },
    )

    expect(response.status).toEqual(404)
  })

  test('it should return 400 for invalid payload on organization creation', async () => {
    const res = await app.request('/api/v1/organization', {
      method: 'POST',
      body: JSON.stringify({
        foo: 'bar',
      }),
      headers,
    })

    expect(res.status).toEqual(400)
  })

  test('it should return 401 for unauthorized access', async () => {
    const response = await client.api.v1.organization[':id'].$get({
      param: {
        id: '123',
      },
    })

    expect(response.status).toEqual(401)
  })
})
