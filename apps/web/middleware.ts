import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { env } from './env'
import { ofetch } from 'ofetch'
import { type User } from '@repo/server'

const isProtectedRoute = (pathname: string) => {
  return pathname.startsWith('/admin')
}

const AUTH_PAGES_PATH = ['/login', '/sign-up', '/verify-otp']

export async function middleware(request: NextRequest) {
  const session = request.cookies.get(env.SESSION_COOKIE_NAME)
  const host = request.headers.get('host')!
  const { pathname } = request.nextUrl

  const redirectBaseUrl = host.startsWith('localhost:')
    ? `http://${host}`
    : `https://${host.split(':')[0]}`
  let rewriteBaseUrl = redirectBaseUrl

  if (env.IS_DOCKER) {
    rewriteBaseUrl = host.startsWith('localhost:')
      ? `http://host.docker.internal:${host.split(':')[1]}`
      : `https://${host.split(':')[0]}`
  }

  if (!session && isProtectedRoute(pathname)) {
    return NextResponse.rewrite(new URL('/not-found', rewriteBaseUrl))
  }

  const headers = new Headers()

  headers.set('X-Forwarded-For', request.ip || 'anon')
  headers.set('Cookie', request.cookies.toString())

  try {
    const res = await ofetch(
      new URL('/api/v1/user/me', rewriteBaseUrl).toString(),
      {
        headers,
      },
    )

    const user = res.data as User

    if (AUTH_PAGES_PATH.includes(pathname)) {
      return NextResponse.redirect(new URL('/', redirectBaseUrl))
    }

    const nextFn = NextResponse.next()
    nextFn.headers.set('User-Object', JSON.stringify(user))

    return nextFn
  } catch (error) {
    if (isProtectedRoute(pathname)) {
      return NextResponse.rewrite(new URL('/not-found', rewriteBaseUrl))
    }
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
