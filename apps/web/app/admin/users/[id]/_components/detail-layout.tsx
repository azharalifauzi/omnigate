import Link from '~/components/link'
import { ChevronLeft } from 'lucide-react'
import React from 'react'
import { useParams } from 'next/navigation'

const UserDetailLayout: React.FC<{
  children?: React.ReactNode
  name: string
}> = ({ children, name }) => {
  const params = useParams<{ id: string }>()
  const id = params?.id

  return (
    <main>
      <aside className="fixed top-0 bottom-0 left-0 w-72 px-10 py-6">
        <Link
          href="/admin/users"
          className="font-medium mb-8 flex items-center -ml-4"
        >
          <ChevronLeft className="mr-1 h-5 w-5" />
          Back
        </Link>
        <div className="mb-6">
          <div className="text-sm">Users</div>
          <div className="text-lg font-medium">{name}</div>
        </div>
        <div className="grid gap-3">
          <Link
            end
            className="text-lg hover:underline data-[active=true]:underline"
            href={`/admin/users/${id}`}
          >
            Profile
          </Link>
          <Link
            className="text-lg hover:underline data-[active=true]:underline"
            href={`/admin/users/${id}/roles`}
          >
            Roles
          </Link>
          <Link
            className="text-lg hover:underline data-[active=true]:underline"
            href={`/admin/users/${id}/feature-flags`}
          >
            Feature Flags
          </Link>
        </div>
      </aside>
      <div className="fixed top-0 left-72 bottom-0 right-0 overflow-auto">
        {children}
      </div>
    </main>
  )
}

export default UserDetailLayout
