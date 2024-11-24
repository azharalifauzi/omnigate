import '@repo/ui/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import Providers from '~/components/providers'
import UserContextProvider from '~/components/user-context-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Omnigate',
  description: 'Build Faster, Secure Smarter.',
  icons: '/favicon.svg',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  /**
   * NOTE: using headers() causing dynamic rendering, which make SSG not working,
   * If you still want to use SSG on some route, you can just move this headers()
   * and UserContextProvider to admin/layout.tsx or somewhere else that need the user object
   */
  const headerList = headers()
  const userObject = headerList.get('user-object')

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <UserContextProvider
            user={userObject ? JSON.parse(userObject) : null}
          >
            {children}
          </UserContextProvider>
        </Providers>
      </body>
    </html>
  )
}
