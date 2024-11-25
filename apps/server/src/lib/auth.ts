import { AuthorizationCode } from 'simple-oauth2'
import { env } from '~/env'

export const googleClient = new AuthorizationCode({
  client: {
    id: env.GOOGLE_CLIENT_ID,
    secret: env.GOOGLE_CLIENT_SECRET,
  },
  auth: {
    authorizeHost: 'https://accounts.google.com',
    authorizePath: '/o/oauth2/v2/auth',
    tokenHost: 'https://oauth2.googleapis.com',
    tokenPath: '/token',
  },
})

export const googleAuthScope = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]
