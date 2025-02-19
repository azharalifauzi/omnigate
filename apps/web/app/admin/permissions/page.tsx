import { getUserServerSession } from '~/utils/server'
import PermissionFeature from './client'
import { AUTH_ROUTE_CONFIG } from '~/configs/auth'
import { notFound } from 'next/navigation'

const Page = async () => {
  const { getPermission } = await getUserServerSession()

  const isGranted = getPermission(
    AUTH_ROUTE_CONFIG['/admin/permissions'].permissions,
  )

  if (!isGranted) {
    return notFound()
  }

  return <PermissionFeature />
}

export default Page
