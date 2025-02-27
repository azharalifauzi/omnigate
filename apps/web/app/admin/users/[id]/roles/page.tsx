import { getUserServerSession } from '~/utils/server'
import UserRoleManagement from './client'
import { AUTH_ROUTE_CONFIG } from '~/configs/auth'
import { notFound } from 'next/navigation'

const Page = async () => {
  const { getPermission } = await getUserServerSession()

  const isGranted = getPermission(
    AUTH_ROUTE_CONFIG['/admin/users/[id]/roles'].permissions,
  )

  if (!isGranted) {
    return notFound()
  }

  return <UserRoleManagement />
}

export default Page
