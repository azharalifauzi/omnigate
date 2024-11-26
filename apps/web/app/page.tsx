import { getServerSideUserObject } from '~/utils/server'
import { Button } from '@repo/ui/components/ui/button'
import Link from '~/components/link'
import { SiGithub } from '@icons-pack/react-simple-icons'
import { match } from 'ts-pattern'

export default function Page() {
  const { user } = getServerSideUserObject()

  return (
    <main className="flex items-center justify-center min-h-screen">
      <section className="w-max-7xl mx-auto px-6 -mt-12">
        <h1 className="text-center text-5xl font-semibold leading-tight mb-6">
          The Ultimate Next.js Boilerplate <br /> for Self-Hosting
        </h1>
        <p className="text-center max-w-2xl mx-auto mb-10 text-lg text-gray-600">
          Accelerate your development with robust type safety, built-in user
          management, and full control over roles and permissions—all without
          relying on paid third-party services.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button className="px-8" variant="secondary" asChild>
            <a href="https://github.com/azharalifauzi/omnigate" target="_blank">
              <SiGithub />
              Github
            </a>
          </Button>
          <Button className="px-8" asChild>
            {match(user)
              .with(null, () => <Link href="/login">Login</Link>)
              .otherwise(() => (
                <form action="/api/v1/auth/logout" method="post">
                  <button type="submit">Logout</button>
                </form>
              ))}
          </Button>
        </div>
        {user && (
          <div className="border border-gray-300 w-max mx-auto mt-8 px-6 py-4 rounded-lg bg-gray-50">
            <div>Name: {user.name}</div>
            <div>Email: {user.email}</div>
          </div>
        )}
      </section>
    </main>
  )
}
