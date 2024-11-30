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
  authMethods,
  organizations,
} from '~/schemas'
import { createSessionToken } from '~/utils/session'
import { v4 as uuidv4 } from 'uuid'
import { authMiddleware } from '~/middlewares/auth'
import { googleAuthScope, googleClient } from '~/lib/auth'
import { everyPermissions } from '~/services/permissions'

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

      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      })

      if (existingUser) {
        throw new ServerError({
          statusCode: 400,
          message: 'Sign Failed',
          description: 'User already exist, please try to login.',
        })
      }

      const user = (
        await db
          .insert(users)
          .values({
            name,
            email,
          })
          .returning()
      )[0]!

      const defaultOrg = await db.query.organizations.findFirst({
        where: eq(organizations.isDefault, true),
      })

      if (!defaultOrg) {
        throw new ServerError({
          statusCode: 500,
          message: 'Internal Server Error',
          description: 'Default organization is not found',
        })
      }

      await db.insert(usersToOrganizations).values({
        organizationId: defaultOrg.id,
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
            organizationId: defaultOrg.id,
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

      await db.insert(authMethods).values({
        provider: 'passwordless',
        userId: user.id,
        providerId: email,
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
          message: 'User not found, please sign up.',
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
  .get('/sign-in/google', (c) => {
    const authorizationUri = googleClient.authorizeURL({
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      scope: googleAuthScope.join(' '),
      state: uuidv4(),
    })

    return c.redirect(authorizationUri)
  })
  .get('/callback/google', async (c) => {
    const code = c.req.query('code')

    if (!code) {
      throw new ServerError({
        statusCode: 400,
        message: 'Login failed',
        description: 'Authorization code is missing',
      })
    }

    const accessToken = await googleClient.getToken({
      code,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
    })

    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
      {
        headers: { Authorization: `Bearer ${accessToken.token.access_token}` },
      },
    )

    const userInfo = await userInfoResponse.json()

    let userId: number

    const existingAuthMethods = await db.query.authMethods.findFirst({
      where: eq(authMethods.providerId, userInfo.id),
    })

    const defaultOrg = await db.query.organizations.findFirst({
      where: eq(organizations.isDefault, true),
    })

    if (!defaultOrg) {
      throw new ServerError({
        statusCode: 500,
        message: 'Internal Server Error',
        description: 'Default organization is not found',
      })
    }

    if (!existingAuthMethods) {
      const newUser = await db
        .insert(users)
        .values({
          email: userInfo.email,
          name: userInfo.name,
          image: userInfo.picture,
          isEmailVerified: true,
        })
        .returning()

      await db.insert(authMethods).values({
        userId: newUser[0]!.id,
        provider: 'google',
        providerId: userInfo.id,
      })

      await db.insert(usersToOrganizations).values({
        organizationId: defaultOrg.id,
        userId: newUser[0]!.id,
      })

      const assignedRoles = await db
        .select()
        .from(roles)
        .where(eq(roles.assignedOnSignUp, true))

      if (assignedRoles.length > 0) {
        await db.insert(rolesToUsers).values(
          assignedRoles.map((role) => ({
            roleId: role.id,
            userId: newUser[0]!.id,
            organizationId: defaultOrg.id,
          })),
        )
      }

      userId = newUser[0]!.id
    } else {
      userId = existingAuthMethods.userId
    }

    const sessionId = uuidv4()
    const sessionToken = createSessionToken(sessionId)
    const expiresAt = dayjs().add(90, 'days').toDate()

    await db.insert(sessions).values({
      sessionToken,
      userId,
      expiresAt: expiresAt.toISOString(),
    })

    setCookie(c, env.SESSION_COOKIE_NAME, sessionToken)

    return c.redirect('/')
  })
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

      const isExpired = dayjs(
        otpObject.expiredAt.split(' ').join('T') + 'Z',
      ).isBefore(dayjs())

      if (isExpired) {
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
      return generateJsonResponse(c)
    }

    deleteCookie(c, env.SESSION_COOKIE_NAME)
    db.delete(sessions).where(eq(sessions.sessionToken, sessionToken))

    return c.redirect('/')
  })
  .post(
    '/impersonate',
    authMiddleware({
      permission: everyPermissions(['write:users', 'read:users']),
    }),
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
