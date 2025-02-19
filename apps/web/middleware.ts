import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { env } from './env'
import { ofetch } from 'ofetch'
import { type User } from '@repo/server'

const isProtectedRoute = (pathname: string) => {
  return pathname.startsWith('/admin')
}

const AUTH_PAGES_PATH = ['/login', '/sign-up', '/verify-otp']

function isRunningDockerCompose(): boolean {
  return process.env.IS_DOCKER_COMPOSE === 'true'
}

function isRunningSingleFileDocker(): boolean {
  return process.env.IS_SINGLE_FILE_DOCKER === 'true'
}

const HTTP_PORT_TO_PROTOCOL_MAP: Record<string, string> = {
  '80': 'http://',
  '443': 'https://',
}

// This function will assume if there's no port, means it run in production
// that uses https protocol
function getProtocol(port: string | undefined) {
  return port ? (HTTP_PORT_TO_PROTOCOL_MAP[port] ?? 'http://') : 'https://'
}

export async function middleware(request: NextRequest) {
  const session = request.cookies.get(env.SESSION_COOKIE_NAME)
  const host = request.headers.get('host')!
  const { pathname } = request.nextUrl

  const [hostname, port] = host.split(':')
  const protocol = getProtocol(port)

  const redirectBaseUrl = `${protocol}${hostname}${port ? `:${port}` : ''}`
  let rewriteBaseUrl = redirectBaseUrl
  let backendUrl = redirectBaseUrl

  if (isRunningDockerCompose()) {
    rewriteBaseUrl = 'http://web:3000'
    backendUrl = 'http://server:4000'
  }

  if (isRunningSingleFileDocker()) {
    rewriteBaseUrl =
      protocol === 'http://'
        ? `http://host.docker.internal:${port}`
        : 'http://localhost:3000'
    backendUrl = 'http://localhost:4000'
  }

  if (!session && isProtectedRoute(pathname)) {
    return NextResponse.rewrite(new URL('/not-found', rewriteBaseUrl))
  }

  const headers = new Headers()

  const userAgent = request.headers.get('User-Agent')
  const xRealIp = request.headers.get('x-real-ip') || 'anon'
  const xForwardedFor =
    request.headers.get('x-forwarded-for')?.split(',')[0] || 'anon'

  headers.set('x-real-ip', xRealIp)
  headers.set('x-forwarded-for', xForwardedFor)

  headers.set('Cookie', request.cookies.toString())
  if (userAgent) {
    headers.set('User-Agent', userAgent)
  }

  try {
    const res = await ofetch(
      new URL('/api/v1/user/me', backendUrl).toString(),
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
