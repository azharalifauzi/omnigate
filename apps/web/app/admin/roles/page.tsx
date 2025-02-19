import { getUserServerSession } from '~/utils/server'
import RoleFeature from './client'
import { AUTH_ROUTE_CONFIG } from '~/configs/auth'
import { notFound } from 'next/navigation'

const Page = async () => {
  const { getPermission } = await getUserServerSession()

  const isGranted = getPermission(AUTH_ROUTE_CONFIG['/admin/roles'].permissions)

  if (!isGranted) {
    return notFound()
  }

  return <RoleFeature />
}

export default Page
