import dayjs from 'dayjs'
import { eq, not } from 'drizzle-orm'
import { testClient } from 'hono/testing'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import app from '~/app'
import { env } from '~/env'
import { db } from '~/lib/db'
import { otpTokens, users } from '~/schemas'
import { createUserWithRole } from '~/utils/test-utils'

vi.mock('nodemailer', () => {
  return {
    default: {
      createTransport: vi.fn().mockImplementation(() => ({ sendMail })),
    },
  }
})

vi.mock('@react-email/components', () => ({ render: vi.fn() }))

const { sendMail } = vi.hoisted(() => ({
  sendMail: vi.fn(),
}))

beforeEach(async () => {
  await db.delete(users).where(not(eq(users.email, 'admin@sidrstudio.com')))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Auth controller API', () => {
  test('it should create new user, return otp token, and send otp to email', async () => {
    const response = await testClient(app).api.v1.auth['sign-up'].$post({
      json: {
        name: 'John Doe',
        email: 'john@sidrstudio.com',
      },
    })

    const { data } = await response.json()
    const user = await db.query.users.findFirst({
      where: eq(users.email, 'john@sidrstudio.com'),
    })

    expect(data.otpToken).toBeDefined()
    expect(user).toBeDefined()
    expect(user?.name).toEqual('John Doe')
    expect(sendMail).toBeCalled()
  })

  test('it should return and send otp token to email for existing user', async () => {
    await createUserWithRole('John Doe', 'john@sidrstudio.com')

    const response = await testClient(app).api.v1.auth['sign-in'].$post({
      json: {
        email: 'john@sidrstudio.com',
      },
    })

    const { data } = await response.json()

    expect(data.otpToken).toBeDefined()
    expect(sendMail).toBeCalled()
  })

  test('it should verify otp and set session cookie', async () => {
    const response = await testClient(app).api.v1.auth['sign-up'].$post({
      json: {
        name: 'John Doe',
        email: 'john@sidrstudio.com',
      },
    })

    const { data } = await response.json()
    const otpObject = await db.query.otpTokens.findFirst({
      where: eq(otpTokens.token, data.otpToken),
    })

    const otpResponse = await testClient(app).api.v1.auth['verify-otp'].$post({
      json: {
        otpToken: data.otpToken,
        otp: otpObject!.otp,
      },
    })

    expect(otpResponse.status).toEqual(200)
    expect(otpResponse.headers.get('Set-Cookie')).toBeDefined()
    expect(
      otpResponse.headers
        .get('Set-Cookie')
        ?.includes(`${env.SESSION_COOKIE_NAME}=`),
    ).toEqual(true)
  })

  describe('Login negative test cases', () => {
    test('it should return 404 if user not exist', async () => {
      const response = await testClient(app).api.v1.auth['sign-in'].$post({
        json: {
          email: 'john@sidrstudio.com',
        },
      })

      expect(response.status).toEqual(404)
    })

    test('it should return 403 if user is suspended', async () => {
      const user = await createUserWithRole('John Doe', 'john@sidrstudio.com')

      await db
        .update(users)
        .set({
          suspendedAt: dayjs().toISOString(),
        })
        .where(eq(users.id, user.id))

      const response = await testClient(app).api.v1.auth['sign-in'].$post({
        json: {
          email: 'john@sidrstudio.com',
        },
      })

      expect(response.status).toEqual(403)
    })
  })

  describe('Sign up negative test cases', () => {
    test('it should return 400 if user already exist', async () => {
      await createUserWithRole('John Doe', 'john@sidrstudio.com')

      const response = await testClient(app).api.v1.auth['sign-up'].$post({
        json: {
          name: 'John Doe',
          email: 'john@sidrstudio.com',
        },
      })

      expect(response.status).toEqual(400)
    })
  })

  describe('verify otp negative test cases', () => {
    test('it should return 401 if otp is expired', async () => {
      vi.useFakeTimers()
      const response = await testClient(app).api.v1.auth['sign-up'].$post({
        json: {
          name: 'John Doe',
          email: 'john@sidrstudio.com',
        },
      })

      const { data } = await response.json()

      vi.advanceTimersByTime(2 * 60 * 60 * 1000) // Execute after two hours

      const otpObject = await db.query.otpTokens.findFirst({
        where: eq(otpTokens.token, data.otpToken),
      })

      const otpResponse = await testClient(app).api.v1.auth['verify-otp'].$post(
        {
          json: {
            otpToken: data.otpToken,
            otp: otpObject!.otp,
          },
        },
      )

      expect(otpResponse.status).toEqual(401)
    })
  })
})
