import { zValidator } from '@hono/zod-validator'
import { render } from '@react-email/components'
import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { customAlphabet } from 'nanoid'
import { z } from 'zod'
import { env } from '~/env'
import { db } from '~/lib/db'
import { transporter } from '~/lib/email'
import VerifyOtpEmail from '~/lib/email/templates/verify-otp'
import { ServerError } from '~/lib/error'
import { generateJsonResponse } from '~/lib/response'
import {
  roles,
  rolesToUsers,
  sessions,
  users,
  usersToOrganizations,
  otpTokens,
} from '~/schemas'
import { createSessionToken } from '~/utils/session'
import { v4 as uuidv4 } from 'uuid'
import { authMiddleware } from '~/middlewares/auth'

const app = new Hono()
  .post(
    '/sign-up',
    zValidator(
      'json',
      z.object({
        email: z.string().email(),
        name: z.string(),
      }),
    ),
    async (c) => {
      const { name, email } = c.req.valid('json')
      const user = (
        await db
          .insert(users)
          .values({
            name,
            email,
          })
          .returning()
      )[0]!

      await db.insert(usersToOrganizations).values({
        organizationId: env.DEFAULT_ORG_ID,
        userId: user.id,
      })

      const assignedRoles = await db
        .select()
        .from(roles)
        .where(eq(roles.assignedOnSignUp, true))

      if (assignedRoles.length > 0) {
        await db.insert(rolesToUsers).values(
          assignedRoles.map((role) => ({
            roleId: role.id,
            userId: user.id,
            organizationId: env.DEFAULT_ORG_ID,
          })),
        )
      }

      const tokenId = uuidv4()
      const token = createSessionToken(tokenId)
      const expiresAt = dayjs().add(1, 'hour').toDate()
      const otp = customAlphabet('1234567890')(6)

      await db.insert(otpTokens).values({
        token,
        otp,
        expiredAt: expiresAt.toISOString(),
        userId: user.id,
      })

      // Send otp to email
      const emailHtml = await render(<VerifyOtpEmail otpCode={otp} />)
      await transporter.sendMail({
        from: env.EMAIL_SENDER,
        to: env.NODE_ENV === 'development' ? env.EMAIL_CATCHER : user.email,
        subject: 'Email verification code',
        html: emailHtml,
      })

      return generateJsonResponse(
        c,
        {
          ...user,
          otpToken: token,
        },
        201,
      )
    },
  )
  .post(
    '/sign-in',
    zValidator('json', z.object({ email: z.string().email() })),
    async (c) => {
      const data = c.req.valid('json')

      const user = await db.query.users.findFirst({
        where: eq(users.email, data.email),
      })

      if (!user) {
        throw new ServerError({
          statusCode: 404,
          message: 'User not found',
        })
      }

      if (user.suspendedAt !== null) {
        throw new ServerError({
          statusCode: 403,
          message: 'Login failed',
          description: 'Your account is suspended',
        })
      }

      const tokenId = uuidv4()
      const token = createSessionToken(tokenId)
      const expiresAt = dayjs().add(1, 'hour').toDate()
      const otp = customAlphabet('1234567890')(6)

      await db.insert(otpTokens).values({
        token,
        otp,
        expiredAt: expiresAt.toISOString(),
        userId: user.id,
      })

      // Send otp to email
      const emailHtml = await render(<VerifyOtpEmail otpCode={otp} />)
      await transporter.sendMail({
        from: env.EMAIL_SENDER,
        to: env.NODE_ENV === 'development' ? env.EMAIL_CATCHER : user.email,
        subject: 'Email verification code',
        html: emailHtml,
      })

      return generateJsonResponse(c, {
        otpToken: token,
      })
    },
  )
  .post(
    '/verify-otp',
    zValidator(
      'json',
      z.object({
        otpToken: z.string(),
        otp: z.string().length(6),
      }),
    ),
    async (c) => {
      const body = c.req.valid('json')
      const otpObject = await db.query.otpTokens.findFirst({
        where: eq(otpTokens.token, body.otpToken),
      })

      if (!otpObject || otpObject.otp !== body.otp) {
        throw new ServerError({
          statusCode: 401,
          message: 'Your OTP is invalid',
        })
      }

      const sessionId = uuidv4()
      const sessionToken = createSessionToken(sessionId)
      const expiresAt = dayjs().add(7, 'days').toDate()

      await db.insert(sessions).values({
        sessionToken,
        expiresAt: expiresAt.toISOString(),
        userId: otpObject.userId,
      })

      await db
        .update(users)
        .set({
          isEmailVerified: true,
        })
        .where(eq(users.id, otpObject.userId))

      setCookie(c, env.SESSION_COOKIE_NAME, sessionToken)

      return generateJsonResponse(c)
    },
  )
  .post('/logout', async (c) => {
    const sessionToken = getCookie(c, env.SESSION_COOKIE_NAME)

    if (!sessionToken) {
      return c.json({
        statusCode: 200,
        message: 'OK',
      })
    }

    deleteCookie(c, env.SESSION_COOKIE_NAME)
    db.delete(sessions).where(eq(sessions.sessionToken, sessionToken))

    return generateJsonResponse(c)
  })
  .post(
    '/impersonate',
    authMiddleware({ permission: 'write:users' }),
    zValidator('json', z.object({ userId: z.number() })),
    async (c) => {
      const { userId } = c.req.valid('json')

      const sessionId = uuidv4()
      const sessionToken = createSessionToken(sessionId)
      const expiresAt = dayjs().add(7, 'days').toDate()

      await db.insert(sessions).values({
        sessionToken,
        userId,
        expiresAt: expiresAt.toISOString(),
      })

      const currentSessionToken = getCookie(c, env.SESSION_COOKIE_NAME)

      if (currentSessionToken) {
        await db
          .delete(sessions)
          .where(eq(sessions.sessionToken, currentSessionToken))
      }

      setCookie(c, env.SESSION_COOKIE_NAME, sessionToken)

      return generateJsonResponse(c)
    },
  )
  .post(
    '/resend-otp',
    zValidator('json', z.object({ otpToken: z.string() })),
    async (c) => {
      const { otpToken } = c.req.valid('json')

      const otpObject = await db.query.otpTokens.findFirst({
        where: eq(otpTokens.token, otpToken),
      })

      if (!otpObject) {
        throw new ServerError({
          statusCode: 404,
          message: 'Resending OTP failed',
          description: 'Otp token is invalid',
        })
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, otpObject.userId),
        columns: { email: true, id: true },
      })

      if (!user) {
        throw new ServerError({
          statusCode: 404,
          message: 'Resending OTP failed',
          description: 'Otp token is invalid',
        })
      }

      const newExpiresAt = dayjs().add(1, 'hour').toDate()
      const newOtp = customAlphabet('1234567890')(6)

      await db
        .update(otpTokens)
        .set({
          otp: newOtp,
          expiredAt: newExpiresAt.toISOString(),
        })
        .where(eq(otpTokens.token, otpToken))

      // Send otp to email
      const emailHtml = await render(<VerifyOtpEmail otpCode={newOtp} />)
      await transporter.sendMail({
        from: env.EMAIL_SENDER,
        to: env.NODE_ENV === 'development' ? env.EMAIL_CATCHER : user.email,
        subject: 'Email verification code',
        html: emailHtml,
      })

      return generateJsonResponse(c)
    },
  )

export default app
